/////////////////////////// determine optimal orbit properties ///////////////////////////
// define collection
var point = /* color: #d63000 */ee.Geometry.Point([5.500640227558629, 52.971219187848085]);
var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filterBounds(point);

// get relative orbit numbers
var orbits = s1.aggregate_array('relativeOrbitNumber_start')
  .distinct()
  .sort();

// print relative orbit number, pass direction, platform number and number of images per orbit
orbits.evaluate(function(orbits) {
  for (var i = 0; i < orbits.length; i++) {
    var orbit = orbits[i];
    var pass_direction = s1.filterMetadata('relativeOrbitNumber_start', 'equals', orbit)
                          .first().get('orbitProperties_pass').getInfo();
    var platform_number = s1.filterMetadata('relativeOrbitNumber_start', 'equals', orbit)
                          .first().get('platform_number').getInfo();
    var count = s1.filterMetadata('relativeOrbitNumber_start', 'equals', orbit).size().getInfo();
    print('Relative orbit number: ' + orbit + ', Pass direction: ' + pass_direction + 
          ', Platform number: ' + platform_number + ', Number of images: ' + count);
  }
});


/////////////////////////// function to create LUI image collection for 1 year ///////////////////////////
function createLUI(dateStart, dateEnd, platform, relativeOrbit, band) {
 
  // subset one year and order chronologically  
  var reference = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filterBounds(point)
    .filterDate(dateStart, dateEnd)
    .filter(ee.Filter.eq('platform_number', platform))
    .filter(ee.Filter.inList('relativeOrbitNumber_start', [relativeOrbit]))
    .select(band)
    .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING')); 
  print(reference, 'reference ' + dateStart.slice(0,4));

  // get first image
  var first = reference.limit(1, 'system:time_start', true).first();
  // get ID of first image
  var firstim = first.get('system:index');
  // get last image and ID
  var last = reference.limit(1, 'system:time_start', false).first();
  var lastim = last.get('system:index');

  // make two image collections: one starting with the first image minus the last, and
  // the second starting with the second image including the last image
  var n1 = reference.filter(ee.Filter.neq('system:index', firstim));
  var n2 = reference.filter(ee.Filter.neq('system:index', lastim));

  // make a list and pair elements from two image collections
  var list = n1.toList(n1.size()).zip(n2.toList(n2.size()));
  print(list, 'list');

  // calculate log ratio 
  var logRatio = ee.ImageCollection.fromImages(
    list.map(function (im) {
      im = ee.List(im);
      var ImList1 = ee.Image(im.get(0));
      var ImList2 = ee.Image(im.get(1));
      return ImList1.divide(ImList2).log10();
    })
  );

  // calculate LUI based on standard deviation of log ratio differences between date pairs
  var LUI = logRatio.reduce(ee.Reducer.stdDev());
  Map.addLayer(LUI, {min:0, max:0.1}, 'LUI ' + dateStart.slice(0,4));
  return LUI;
}

// create LUI image collections for each year
var LUI_2016 = createLUI('2016-03-31', '2016-07-18', 'A', 110, 'VH');
var LUI_2017 = createLUI('2017-03-31', '2017-07-16', 'A', 110, 'VH');
var LUI_2018 = createLUI('2018-03-31', '2018-07-18', 'A', 37, 'VH');
var LUI_2019 = createLUI('2019-03-31', '2019-07-18', 'A', 110, 'VH');
var LUI_2020 = createLUI('2020-03-31', '2020-07-18', 'A', 110, 'VH');
var LUI_2021 = createLUI('2021-03-31', '2021-07-18', 'A', 110, 'VH');
var LUI_2022 = createLUI('2022-03-31', '2022-07-18', 'A', 110, 'VH');

/////////////////////////// export LUI images to drive ///////////////////////////
var folder = 'LUI_BRP_Calibration';
var crs = 'EPSG:4326';
var SWF = ee.FeatureCollection("projects/t-b-craft/assets/LUI_2016_update2021parcels_WG84");
var region = SWF;
var scale = 10;

Export.image.toDrive({
  image: LUI_2016,
  description: 'LUI_2016',
  folder: folder,
  crs: crs,
  scale: scale
});

Export.image.toDrive({
  image: LUI_2017,
  description: 'LUI_2017',
  folder: folder,
  crs: crs,
  scale: scale
});

Export.image.toDrive({
  image: LUI_2018,
  description: 'LUI_2018',
  folder: folder,
  crs: crs,
  scale: scale
});

Export.image.toDrive({
  image: LUI_2019,
  description: 'LUI_2019',
  folder: folder,
  crs: crs,
  scale: scale
});

Export.image.toDrive({
  image: LUI_2020,
  description: 'LUI_2020',
  folder: folder,
  crs: crs,
  scale: scale
});

Export.image.toDrive({
  image: LUI_2021,
  description: 'LUI_2021',
  folder: folder,
  crs: crs,
  scale: scale
});

Export.image.toDrive({
  image: LUI_2022,
  description: 'LUI_2022',
  folder: folder,
  crs: crs,
  scale: scale
});
