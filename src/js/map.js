var map, mapFeatures, globalLayer, globalLabelLayer, countryLayer, countryBoundaryLayer, countryLabelLayer, tooltip;
var adm0SourceLayer = 'arab-states-adm0-polbnda';
var hoveredStateId = null;
function initMap() {
  console.log('Loading map...')
  map = new mapboxgl.Map({
    container: 'global-map',
    style: 'mapbox://styles/humdata/cl3lpk27k001k15msafr9714b',//mapbox://styles/humdata/cl1f9m6ir000r14qvm4uyd42r
    center: [centerLon, centerLat],
    minZoom: 1,
    zoom: zoomLevel,
    attributionControl: false
  });

  map.addControl(new mapboxgl.NavigationControl({showCompass: false}))
     .addControl(new mapboxgl.AttributionControl(), 'bottom-right');

  map.on('load', function() {
    console.log('Map loaded')
    
    mapLoaded = true;
    if (dataLoaded==true) displayMap();
  });
}

function displayMap() {
  console.log('Display map');

  //remove loader and show vis
  $('.loader, #static-map').remove();
  $('#global-map, .country-select, .map-legend, .tab-menubar').css('opacity', 1);

  //position global figures
  if (window.innerWidth>=1440) {
    $('.menu-indicators:first li:first-child div').addClass('expand');
    $('.secondary-panel').animate({
      left: 0
    }, 200);
  }

  //set initial indicator
  currentIndicator = {
    id: $('.menu-indicators').find('.selected').attr('data-id'), 
    name: $('.menu-indicators').find('.selected').attr('data-legend'), 
    title: $('.menu-indicators').find('.selected').text()
  };

  //get bottommost layer from basemap
  const layers = map.getStyle().layers;
  for (const layer of layers) {
    if (layer.id==='Dashed bnd 1m') {
      baseLayer = layer.id;
    }
    if (layer.id.startsWith('Countries')) {
      map.setLayoutProperty(layer.id, 'text-allow-overlap', true);
    }
  }

  //add map layers

  //layer sources
  let adm0Source = 'arab-states-adm0-polbnda';
  let adm0CentroidSource = 'arab_states_centroid_int_1m_u-9kgyhy';
  let adm1Source = 'arab_states_polbnda_adm1_1m_u-17b61m';
  let adm1CentroidSource = 'arab_states_centroid_adm1_1m_-4nnaer';


  //hide labels from mapbox style
  map.setLayoutProperty('Countries 2-4', 'visibility', 'none');
  map.setLayoutProperty('Countries 4-6', 'visibility', 'none');


  //adm0
  map.addSource('adm0-polygons', {
    'url': 'mapbox://humdata.aioadufm',
    'type': 'vector'
  });

  //adm0 fills
  map.addLayer({
    'id': 'adm0-fills',
    'type': 'fill',
    'source': 'adm0-polygons',
    'source-layer': adm0Source,
    'paint': {
      'fill-color': '#F1F1EE',
      'fill-opacity': 1,
    }
  }, baseLayer);
  globalLayer = 'adm0-fills';
  map.setLayoutProperty(globalLayer, 'visibility', 'visible');

  //adm0 centroids
  map.addSource('adm0-centroids', {
    'url': 'mapbox://humdata.d4ywfeza',
    'type': 'vector'
  });

  //adm0 labels
  map.addLayer({
    'id': 'adm0-labels',
    'type': 'symbol',
    'source': 'adm0-centroids',
    'source-layer': adm0CentroidSource,
    'layout': {
      'text-field': [
        'format',
        ['upcase', ['get', 'Terr_Name']]
      ],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 0, 12, 4, 14],
      'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
      'text-padding': 8
    },
    paint: {
      'text-color': '#444',
      'text-halo-color': '#FFF',
      'text-halo-width': 1,
      'text-halo-blur': 0
    }
  }, baseLayer);
  globalLabelLayer = 'adm0-labels';
  map.setLayoutProperty(globalLabelLayer, 'visibility', 'visible');

  //adm1
  map.addSource('adm1-polygons', {
    'url': 'mapbox://humdata.attm70id',
    'type': 'vector'
  });

  //adm1 fills
  map.addLayer({
    'id': 'adm1-fills',
    'type': 'fill',
    'source': 'adm1-polygons',
    'source-layer': adm1Source,
    'paint': {
      'fill-color': '#F1F1EE',
      'fill-opacity': 1,
    }
  }, baseLayer);
  countryLayer = 'adm1-fills';
  map.setLayoutProperty(countryLayer, 'visibility', 'none');

  //centroids source
  map.addSource('adm1-centroids', {
    'url': 'mapbox://humdata.8pyb1abd',
    'type': 'vector'
  });

  //centroids
  map.addLayer({
    'id': 'adm1-labels',
    'type': 'symbol',
    'source': 'adm1-centroids',
    'source-layer': adm1CentroidSource,
    'layout': {
      'text-field': ['get', 'ADM_REF'],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 0, 12, 4, 14],
      'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
      'text-padding': 8
    },
    paint: {
      'text-color': '#666',
      'text-halo-color': '#EEE',
      'text-halo-width': 1,
      'text-halo-blur': 1
    }
  });
  countryLabelLayer = 'adm1-labels';
  map.setLayoutProperty(countryLabelLayer, 'visibility', 'none');

  //boundaries
  map.addLayer({
    'id': 'adm1-boundaries',
    'type': 'line',
    'source': 'adm1-polygons',
    'source-layer': adm1Source,
    'paint': {
      'line-color': '#E0E0E0',
      'line-opacity': 1
    }
  }, baseLayer);
  countryBoundaryLayer = 'adm1-boundaries';
  map.setLayoutProperty(countryBoundaryLayer, 'visibility', 'none');

  mapFeatures = map.queryRenderedFeatures();

  //load pop density rasters
  var countryList = Object.keys(countryCodeList);
  countryList.forEach(function(country_code) {
    var id = country_code.toLowerCase();
    var raster = countryCodeList[country_code];
    if (raster!='') {
      map.addSource(id+'-pop-tileset', {
        type: 'raster',
        url: 'mapbox://humdata.'+raster
      });

      map.addLayer(
        {
          id: id+'-popdensity',
          type: 'raster',
          source: {
            type: 'raster',
            tiles: ['https://api.mapbox.com/v4/humdata.'+raster+'/{z}/{x}/{y}.png?access_token='+mapboxgl.accessToken],
          }
        },
        countryBoundaryLayer
      );

      map.setLayoutProperty(id+'-popdensity', 'visibility', 'none');
    }
  });

  //init global and country layers
  initGlobalLayer();
  initCountryLayer();

  //init element events
  createEvents();

  //deeplink to country if parameter exists
  if (viewInitialized==true) deepLinkView();

  //create tooltip
  tooltip = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: 'map-tooltip'
  });
}

function deepLinkView() {
  var location = window.location.search;
  //deep link to country view
  if (location.indexOf('?c=')>-1) {
    var countryCode = location.split('c=')[1].toUpperCase();
    if (countryCodeList.hasOwnProperty(countryCode)) {    
      $('.country-select').val(countryCode);
      currentCountry.code = countryCode;
      currentCountry.name = d3.select('.country-select option:checked').text();

      //find matched features and zoom to country
      var selectedFeatures = matchMapFeatures(currentCountry.code);
      selectCountry(selectedFeatures);
    }
  }
  //deep link to specific layer in global view
  if (location.indexOf('?layer=')>-1) {
    var layer = location.split('layer=')[1];
    var menuItem = $('.menu-indicators').find('li[data-layer="'+layer+'"]');
    menuItem = (menuItem.length<1) ? $('.menu-indicators').find('li[data-layer="people_in_need_2023"]') : menuItem;
    selectLayer(menuItem);
  }
}


function matchMapFeatures(country_code) {
  //loop through mapFeatures to find matches to currentCountry.code
  var selectedFeatures = [];
  console.log(currentCountry.code)
  mapFeatures.forEach(function(feature) {
    if (feature.sourceLayer=='wrl_polbnda_1m_ungis' && feature.properties.ISO3_CODE==currentCountry.code) {
      selectedFeatures.push(feature)
    }
  });
  return selectedFeatures;
}

function createEvents() {
  //menu events
  $('.menu-indicators li').on('click', function() {
    selectLayer(this);

    //reset any deep links
    var layer = $(this).attr('data-layer');
    var location = (layer==undefined) ? window.location.pathname : window.location.pathname+'?layer='+layer;
    window.history.replaceState(null, null, location);
  });

  //global figures close button
  $('.secondary-panel .close-btn').on('click', function() {
    var currentBtn = $('[data-id="'+currentIndicator.id+'"]');
    toggleSecondaryPanel(currentBtn);
  });

  //ranking select event
  d3.selectAll('.ranking-select').on('change',function(e) {
    var selected = d3.select(this).node().value;
    if (selected!='') {  
      updateRankingChart(selected);
    }
  });

  //region select event
  d3.select('.region-select').on('change',function(e) {
    currentRegion = d3.select('.region-select').node().value;
    if (currentRegion=='') {
      resetMap();
    }
    else {        
      selectRegion();
    }
  });

  //country select event
  d3.select('.country-select').on('change',function(e) {
    var selected = d3.select('.country-select').node().value;
    if (selected=='') {
      resetMap();
    }
    else {        
      currentCountry.code = selected;
      currentCountry.name = d3.select('.country-select option:checked').text();

      //find matched features and zoom to country
      var selectedFeatures = matchMapFeatures(currentCountry.code);
      selectCountry(selectedFeatures);
    }
  });
  
  //back to global event
  $('.backtoGlobal').on('click', function() {
    resetMap();
    window.history.replaceState(null, null, window.location.pathname);
  });

  //country panel indicator select event
  d3.select('.indicator-select').on('change',function(e) {
    var selected = d3.select('.indicator-select').node().value;
    if (selected!='') {
      var container = $('.panel-content');
      var section = $('.'+selected);
      container.animate({scrollTop: section.offset().top - container.offset().top + container.scrollTop()}, 300);
    }
  });

  //country legend radio events
  $('input[type="radio"]').click(function(){
    var selected = $('input[name="countryIndicators"]:checked');
    currentCountryIndicator = {id: selected.val(), name: selected.parent().text()};
    updateCountryLayer();
    vizTrack(currentCountry.code, currentCountryIndicator.name);
  });
}

//set global layer view
function selectLayer(menuItem) {
  $('.menu-indicators li').removeClass('selected');
  $('.menu-indicators li div').removeClass('expand');
  $(menuItem).addClass('selected');
  if (currentIndicator.id==$(menuItem).attr('data-id')) {
    toggleSecondaryPanel(menuItem);
  }
  else {
    currentIndicator = {id: $(menuItem).attr('data-id'), name: $(menuItem).attr('data-legend'), title: $(menuItem).text()};
    toggleSecondaryPanel(menuItem, 'open');

    //set food prices view
    if (currentIndicator.id!='#indicator+foodbasket+change+pct') {
      closeModal();
    }

    vizTrack('wrl', $(menuItem).find('div').text());
    updateGlobalLayer();
  }
}


function toggleSecondaryPanel(currentBtn, state) {
  var width = $('.secondary-panel').outerWidth();
  var pos = $('.secondary-panel').position().left;
  var newPos = (pos<0) ? 0 : -width;
  if (state=='open') { newPos = 0; }
  if (state=='close') { newPos = -width; }
  var newTabPos = (newPos==0) ? width : 0;
  
  $('.secondary-panel').animate({
    left: newPos
  }, 200, function() {
    var div = $(currentBtn).find('div');
    if ($('.secondary-panel').position().left==0) {
      div.addClass('expand');
    }
    else {
      div.removeClass('expand');
    }
  });
}


function selectRegion() {
  var regionFeature = regionBoundaryData.filter(d => d.properties.tbl_regcov_2020_ocha_Field3 == currentRegion);
  var offset = 50;
  map.fitBounds(regionFeature[0].bbox, {
    padding: {top: offset, right: $('.map-legend').outerWidth()+offset, bottom: offset, left: $('.secondary-panel').outerWidth()+offset},
    linear: true
  });

  vizTrack(currentRegion, currentIndicator.name);
  updateGlobalLayer();
}

function selectCountry(features) {
  //set first country indicator
  $('#population').prop('checked', true);
  currentCountryIndicator = {
    id: $('input[name="countryIndicators"]:checked').val(), 
    name: $('input[name="countryIndicators"]:checked').parent().text()
  };

  //reset panel
  $('.panel-content').animate({scrollTop: 0}, 300);
  $('.indicator-select').val('');

  updateCountryLayer();
  map.setLayoutProperty(globalLayer, 'visibility', 'none');
  map.setLayoutProperty(countryLayer, 'visibility', 'visible');
  map.setLayoutProperty(countryBoundaryLayer, 'visibility', 'visible');
  map.setLayoutProperty(countryLabelLayer, 'visibility', 'visible');

  var target = bbox.default(turfHelpers.featureCollection(features));
  var offset = 50;
  map.fitBounds(target, {
    padding: {top: offset, right: $('.map-legend.country').outerWidth()+offset, bottom: offset, left: ($('.country-panel').outerWidth() - $('.content-left').outerWidth()) + offset},
    linear: true
  });

  map.once('moveend', initCountryView);
  vizTrack(currentCountry.code, currentCountryIndicator.name);

  //append country code to url
  window.history.replaceState(null, null, '?c='+currentCountry.code);
}


/****************************/
/*** GLOBAL MAP FUNCTIONS ***/
/****************************/
function handleGlobalEvents(layer) {
  map.on('mouseenter', globalLayer, function(e) {
    map.getCanvas().style.cursor = 'pointer';
    if (currentIndicator.id!='#indicator+foodbasket+change+pct') {
      tooltip.addTo(map);
    }
  });

  map.on('mousemove', function(e) {
    if (currentIndicator.id!='#indicator+foodbasket+change+pct') {
      var features = map.queryRenderedFeatures(e.point, { layers: [globalLayer, globalLabelLayer] });
      var target;
      features.forEach(function(feature) {
        if (feature.sourceLayer==adm0SourceLayer)
          target = feature;
      });
      if (target!=undefined) {
        tooltip.setLngLat(e.lngLat);

        createMapTooltip(target.properties.ISO_3, target.properties.Terr_Name, e.point);
      }
    }
  });
     
  map.on('mouseleave', globalLayer, function() {
    map.getCanvas().style.cursor = '';
    tooltip.remove();
  });

  map.on('click', function(e) {
    var features = map.queryRenderedFeatures(e.point, { layers: [globalLayer, globalLabelLayer] });
    var target;
    features.forEach(function(feature) {
      if (feature.sourceLayer==adm0SourceLayer)
        target = feature;
    });
    if (target!=null) {
      currentCountry.code = target.properties.ISO_3;
      currentCountry.name = target.properties.Terr_Name;

      if (currentCountry.code!=undefined) {
        var country = nationalData.filter(c => c['#country+code'] == currentCountry.code);
        if (currentIndicator.id=='#indicator+foodbasket+change+pct' && country[0]['#indicator+foodbasket+change+pct']!=undefined) {
          openModal(currentCountry.code, currentCountry.name);
        }
      }
    }
  });
}


function initGlobalLayer() {
  //color scale
  colorScale = getGlobalLegendScale();
  colorNoData = (currentIndicator.id=='#affected+inneed+pct' || currentIndicator.id=='#value+funding+hrp+pct') ? '#E7E4E6' : '#FFF';

  setGlobalLegend(colorScale);

  //data join
  var expression = ['match', ['get', 'ISO_3']];
  nationalData.forEach(function(d) {
    var val = d[currentIndicator.id];
    var color = (val==null || isNaN(val)) ? colorNoData : colorScale(val);
    expression.push(d['#country+code'], color);
  });

  //default value for no data
  expression.push(colorDefault);
  
  //set properties
  map.setPaintProperty(globalLayer, 'fill-color', expression);

  //define mouse events
  handleGlobalEvents();

  //global figures
  setKeyFigures();
}


function updateGlobalLayer() {
  setKeyFigures();

  //color scales
  colorScale = getGlobalLegendScale();
  colorNoData = (currentIndicator.id=='#affected+inneed+pct' || currentIndicator.id=='#value+funding+hrp+pct') ? '#E7E4E6' : '#FFF';

  //data join
  var countryList = [];
  var expression = ['match', ['get', 'ISO_3']];
  nationalData.forEach(function(d) {
    if (regionMatch(d['#region+name'])) {
      var val = d[currentIndicator.id];
      var color = colorDefault;
      
      if (currentIndicator.id=='#indicator+foodbasket+change+pct') {
        if (val<0) val = 0; //hotfix for negative values
        color = (val==null) ? colorNoData : colorScale(val);
      }
      else if (currentIndicator.id=='#severity+inform+type') {
        color = (!isVal(val)) ? colorNoData : colorScale(val);
      }
      else {
        color = (val<0 || isNaN(val) || !isVal(val)) ? colorNoData : colorScale(val);
      }
      expression.push(d['#country+code'], color);

      //create country list for global timeseries chart
      countryList.push(d['#country+name']);
    }
  });

  //default value for no data
  expression.push(colorDefault);

  map.setPaintProperty(globalLayer, 'fill-color', expression);
  setGlobalLegend(colorScale);
}

function getGlobalLegendScale() {
  let data = new Array(); //create copy of indicator data for quantile scales

  //get min/max
  var min = d3.min(nationalData, function(d) { 
    if (regionMatch(d['#region+name'])) {
      data.push(+d[currentIndicator.id]);
      return +d[currentIndicator.id];
    }
  });
  var max = d3.max(nationalData, function(d) { 
    if (regionMatch(d['#region+name'])) return +d[currentIndicator.id];
  });

  if (currentIndicator.id.indexOf('pct')>-1 || currentIndicator.id.indexOf('ratio')>-1) max = 1;
  
  if (currentIndicator.id=='#affected+inneed') max = roundUp(max, 1000000);
  else if (currentIndicator.id=='#severity+inform+type') max = 0;
  else max = max;

  //set scale
  var scale;
  if (currentIndicator.id=='#indicator+foodbasket+change+pct') {
    scale = d3.scaleQuantize().domain([min, max]).range(colorRange);
  }
  else if (currentIndicator.id=='#severity+inform+type') {
    scale = d3.scaleOrdinal().domain(['Very Low', 'Low', 'Medium', 'High', 'Very High']).range(informColorRange);
  }
  else if (currentIndicator.id.indexOf('funding')>-1 || currentIndicator.id.indexOf('financing')>-1) {
    var reverseRange = colorRange.slice().reverse();
    scale = d3.scaleQuantize().domain([0, max]).range(reverseRange);
  }
  else if (currentIndicator.id=='#value+cerf+contributions+total+usd') {
    scale = d3.scaleQuantile().domain(data).range(colorRange);
  }
  else {
    scale = d3.scaleQuantize().domain([0, max]).range(colorRange);
  }

  return (max==undefined) ? null : scale;
}

function setGlobalLegend(scale) {
  var div = d3.select('.map-legend.global');
  var svg;
  var indicator = (currentIndicator.id=='#affected+inneed+pct') ? '#affected+inneed' : currentIndicator.id;
  $('.map-legend.global .source-secondary').empty();

  //SETUP
  if (d3.select('.map-legend.global .scale').empty()) {
    //current indicator
    createSource($('.map-legend.global .indicator-source'), indicator);
    svg = div.append('svg')
      .attr('class', 'legend-container');
    svg.append('g')
      .attr('class', 'scale');

    //bucket reserved for special cases
    var special = div.append('svg')
      .attr('class', 'special-key');

    special.append('rect')
      .attr('width', 15)
      .attr('height', 15);

    special.append('text')
      .attr('class', 'label')
      .text('');

    //no data bucket
    var nodata = div.append('svg')
      .attr('class', 'no-data-key');

    nodata.append('rect')
      .attr('width', 15)
      .attr('height', 15);

    nodata.append('text')
      .attr('class', 'label')
      .text('No Data');


    //secondary source
    $('.map-legend.global').append('<div class="source-secondary"></div>');

    //pin footnote
    createFootnote('.map-legend.global', '#affected+inneed+pct', 'The Total Number of People in Need figure corresponds to 28 HRPs, 7 Regional Appeals, Madagascar\'s Flash Appeal and Lebanon\'s ERP. Population percentages greater than 100% include refugees, migrants, and/or asylum seekers');
    //food prices footnote
    createFootnote('.map-legend.global', '#indicator+foodbasket+change+pct', 'Methodology: Information about food prices is collected from data during the last 6 month moving window. The country ranking for food prices has been determined by calculating the ratio of the number of commodities in alert, stress or crisis and the total number of commodities. The commodity status comes from <a href="https://dataviz.vam.wfp.org" target="_blank" rel="noopener">WFP’s model</a>.');
    //CERF footnote
    createFootnote('.map-legend.global', '#value+cerf+funding+total+usd', 'The Total CERF Funding 2023 figure refers to the Global CERF Allocations, including some non-GHO locations which are not listed on this dashboard.');
    //CBPF footnote
    createFootnote('.map-legend.global', '#value+cbpf+funding+total+usd', 'The Total CBPF Funding 2023 figure refers to the Global CBPF Allocations, including some non-GHO locations which are not listed on this dashboard.');
    
    //boundaries disclaimer
    createFootnote('.map-legend.global', '', 'The boundaries and names shown and the designations used on this map do not imply official endorsement or acceptance by the United Nations.');

    //expand/collapse functionality
    $('.map-legend.global .toggle-icon, .map-legend.global .collapsed-title').on('click', function() {
      $(this).parent().toggleClass('collapsed');
    });
  }
  else {
    updateSource($('.indicator-source'), indicator);
  }

  //POPULATE
  var legendTitle = $('.menu-indicators').find('.selected').attr('data-legend');
  if (currentIndicator.id=='#indicator+foodbasket+change+pct') legendTitle += '<br>Click on a country to explore commodity prices';
  $('.map-legend.global .indicator-title').html(legendTitle);

  //current indicator
  if (scale==null) {
    $('.map-legend.global .legend-container').hide();
  }
  else {
    $('.map-legend.global .legend-container').show();
    var layerID = currentIndicator.id.replaceAll('+','-').replace('#','');
    $('.map-legend.global .legend-container').attr('class', 'legend-container '+ layerID);

    var legendFormat = (currentIndicator.id.indexOf('pct')>-1 || currentIndicator.id.indexOf('ratio')>-1) ? d3.format('.0%') : shortenNumFormat;
    var legend = d3.legendColor()
      .labelFormat(legendFormat)
      .cells(colorRange.length)
      .scale(scale);
    var g = d3.select('.map-legend.global .scale');
    g.call(legend);
  }

  //no data
  var noDataKey = $('.map-legend.global .no-data-key');
  // var specialKey = $('.map-legend.global .special-key');
  // specialKey.hide();
  if (currentIndicator.id=='#affected+inneed+pct') {
    noDataKey.find('.label').text('Refugee/IDP data only');
    noDataKey.find('rect').css('fill', '#E7E4E6');

    createSource($('.map-legend.global .source-secondary'), '#affected+refugees');
    createSource($('.map-legend.global .source-secondary'), '#affected+displaced');
  }
  else if (currentIndicator.id=='#value+funding+hrp+pct') {
    noDataKey.find('.label').text('Other response plans');
    noDataKey.find('rect').css('fill', '#E7E4E6');
  }
  else if (currentIndicator.id=='#targeted+doses+delivered+pct') {
    noDataKey.find('.label').text('Not Included');
    noDataKey.find('rect').css('fill', '#F2F2EF');

    // specialKey.css('display', 'block');
    // specialKey.find('.label').text('Allocations');
    // specialKey.find('rect').css('fill', '#DDD');
  }
  else {
    noDataKey.find('.label').text('No Data');
    noDataKey.find('rect').css('fill', '#FFF');
  }

  //show/hide footnotes
  $('.footnote-indicator').hide();
  $('.footnote-indicator[data-indicator="'+ currentIndicator.id +'"]').show();
}


/*****************************/
/*** COUNTRY MAP FUNCTIONS ***/
/*****************************/
function initCountryView() {
  $('.content').removeClass('tab-view').addClass('country-view');
  $('.country-panel').scrollTop(0);

  initCountryPanel();
}

function initCountryLayer() {
  //color scale
  var clrRange = (currentCountryIndicator.id=='#population') ? populationColorRange : colorRange;
  var countryColorScale = d3.scaleQuantize().domain([0, 1]).range(clrRange);
  createCountryLegend(countryColorScale);

  //mouse events
  map.on('mouseenter', countryLayer, function(e) {
    map.getCanvas().style.cursor = 'pointer';
    tooltip.addTo(map);
  });

  map.on('mousemove', countryLayer, function(e) {
    var f = map.queryRenderedFeatures(e.point)[0];
    if (f.properties.ADM0_REF=='State of Palestine') f.properties.ADM0_REF = currentCountry.name;
    if (f.properties.ADM0_PCODE!=undefined && f.properties.ADM0_REF==currentCountry.name) {
      map.getCanvas().style.cursor = 'pointer';
      createCountryMapTooltip(f.properties.ADM1_REF);
      tooltip
        .addTo(map)
        .setLngLat(e.lngLat);
    }
    else {
      map.getCanvas().style.cursor = '';
      tooltip.remove();
    }
  });
     
  map.on('mouseleave', countryLayer, function() {
    map.getCanvas().style.cursor = '';
    tooltip.remove();
  });
}

function updateCountryLayer() {
  colorNoData = '#FFF';
  if (currentCountryIndicator.id=='#affected+food+ipc+p3plus+num') currentCountryIndicator.id = getIPCDataSource();
  $('.map-legend.country .legend-container').removeClass('no-data');

  //max
  var max = getCountryIndicatorMax();
  if (currentCountryIndicator.id.indexOf('pct')>0 && max>0) max = 1;
  if (currentCountryIndicator.id=='#org+count+num' || currentCountryIndicator.id=='#loc+count+health') max = roundUp(max, 10);

  //color scale
  var clrRange;
  switch(currentCountryIndicator.id) {
    case '#population':
      clrRange = populationColorRange;
      break;
    default:
      clrRange = colorRange;
  }
  var countryColorScale = d3.scaleQuantize().domain([0, max]).range(clrRange);

  //data join
  var expression = ['match', ['get', 'ADM1_PCODE']];
  var expressionBoundary = ['match', ['get', 'ADM1_PCODE']];
  var expressionOpacity = ['match', ['get', 'ADM1_PCODE']];
  subnationalData.forEach(function(d) {
    var color, boundaryColor, layerOpacity;
    if (d['#country+code']==currentCountry.code) {
      var val = +d[currentCountryIndicator.id];
      color = (val<0 || !isVal(val) || isNaN(val)) ? colorNoData : countryColorScale(val);

      //turn off choropleth for population layer
      color = (currentCountryIndicator.id=='#population') ? colorDefault : color;

      boundaryColor = (currentCountryIndicator.id=='#population') ? '#FFF' : '#E0E0E0';
      layerOpacity = 1;
    }
    else {
      color = colorDefault;
      boundaryColor = '#E0E0E0';
      layerOpacity = 0;
    }
    
    expression.push(d['#adm1+code'], color);
    expressionBoundary.push(d['#adm1+code'], boundaryColor);
    expressionOpacity.push(d['#adm1+code'], layerOpacity);
  });
  expression.push(colorDefault);
  expressionBoundary.push('#E0E0E0');
  expressionOpacity.push(0);

  
  //hide all pop density rasters
  var countryList = Object.keys(countryCodeList);
  countryList.forEach(function(country_code) {
    var id = country_code.toLowerCase();
    if (map.getLayer(id+'-popdensity'))
      map.setLayoutProperty(id+'-popdensity', 'visibility', 'none');
  });

  //set properties
  if (currentCountryIndicator.id=='#population') {
    var id = currentCountry.code.toLowerCase();
    map.setLayoutProperty(id+'-popdensity', 'visibility', 'visible');
  }
  map.setPaintProperty(countryLayer, 'fill-color', expression);
  map.setPaintProperty(countryBoundaryLayer, 'line-opacity', expressionOpacity);
  map.setPaintProperty(countryBoundaryLayer, 'line-color', expressionBoundary);
  map.setPaintProperty(countryLabelLayer, 'text-opacity', expressionOpacity);

  //hide color scale if no data
  if (max!=undefined && max>0)
    updateCountryLegend(countryColorScale);
  else
    $('.map-legend.country .legend-container').addClass('no-data');
}

function getIPCDataSource() {
  var source = '';
  subnationalDataByCountry.forEach(function(d) {
    if (d.key==currentCountry.code) {
      source = d['#ipc+source'];
    }
  });
  return source;
}

function getCountryIndicatorMax() {
  var max =  d3.max(subnationalData, function(d) { 
    if (d['#country+code']==currentCountry.code) {
      return +d[currentCountryIndicator.id]; 
    }
  });
  return max;
}

function createCountryLegend(scale) {
  createSource($('.map-legend.country .population-source'), '#population');
  createSource($('.map-legend.country .idps-source'), '#affected+idps+ind');
  createSource($('.map-legend.country .food-security-source'), getIPCDataSource());
  createSource($('.map-legend.country .orgs-source'), '#org+count+num');
  createSource($('.map-legend.country .health-facilities-source'), '#loc+count+health');
  createSource($('.map-legend.country .immunization-source'), '#population+ipv1+pct+vaccinated');

  var legend = d3.legendColor()
    .labelFormat(percentFormat)
    .cells(colorRange.length)
    .title('LEGEND')
    .scale(scale);

  var div = d3.select('.map-legend.country');
  var svg = div.append('svg')
    .attr('class', 'legend-container');

  svg.append('g')
    .attr('class', 'scale')
    .call(legend);

  //no data
  var nodata = div.append('svg')
    .attr('class', 'no-data-key');

  nodata.append('rect')
    .attr('width', 15)
    .attr('height', 15);

  nodata.append('text')
    .attr('class', 'label')
    .text('No Data');

  //boundaries disclaimer
  createFootnote('.map-legend.country', '', 'The boundaries and names shown and the designations used on this map do not imply official endorsement or acceptance by the United Nations.');

  //expand/collapse functionality
  $('.map-legend.country .toggle-icon, .map-legend.country .collapsed-title').on('click', function() {
    $(this).parent().toggleClass('collapsed');
  });
}

function updateCountryLegend(scale) {
  //update IPC source based on current country
  updateSource($('.map-legend.country .food-security-source'), getIPCDataSource());
  
  //special case for IPC source date in legend
  var data = dataByCountry[currentCountry.code][0];
  if (data['#date+ipc+start']!=undefined && data['#date+ipc+end']!=undefined) {
    var startDate = new Date(data['#date+ipc+start']);
    var endDate = new Date(data['#date+ipc+end']);
    startDate = (startDate.getFullYear()==endDate.getFullYear()) ? d3.utcFormat('%b')(startDate) : d3.utcFormat('%b %Y')(startDate);
    var dateRange = startDate +'-'+ d3.utcFormat('%b %Y')(endDate);
    $('.map-legend.country').find('.food-security-source .source .date').text(dateRange);
  }
  else {
    var sourceObj = getSource(getIPCDataSource());
    var date = (sourceObj['#date']==undefined) ? '' : dateFormat(new Date(sourceObj['#date']));
    $('.map-legend.country').find('.food-security-source .source .date').text(date);
  }

  var legendFormat;
  if (currentCountryIndicator.id.indexOf('vaccinated')>-1)
    legendFormat = d3.format('.0%');
  else if (currentCountryIndicator.id=='#population' || currentCountryIndicator.id=='#affected+idps+ind' || currentCountryIndicator.id=='#affected+food+ipc+p3plus+num' || currentCountryIndicator.id=='#affected+ch+food+p3plus+num')
    legendFormat = shortenNumFormat;
  else
    legendFormat = d3.format('.0f');

  var legend = d3.legendColor()
    .labelFormat(legendFormat)
    .cells(colorRange.length)
    .scale(scale);

  var g = d3.select('.map-legend.country .scale');
  g.call(legend);
}


/*************************/
/*** TOOLTIP FUNCTIONS ***/
/*************************/
var lastHovered = '';
function createMapTooltip(country_code, country_name, point) {
  var country = nationalData.filter(c => c['#country+code'] == country_code);
  if (country[0]!=undefined) {
      var val = country[0][currentIndicator.id];

      //format content for tooltip
      if (lastHovered!=country_code) {
        //set formats for value
        if (isVal(val)) {
          if (currentIndicator.id.indexOf('pct')>-1) {
            val = (isNaN(val)) ? 'No Data' : percentFormat(val);
          }
          if (currentIndicator.id.indexOf('total+usd')>-1) val = formatValue(val);
        }
        else {
          val = 'No Data';
        }

        //format content for display
        var content = '<h2>'+ country_name +'</h2>';

        //PIN layer shows refugees and IDPs
        if (currentIndicator.id=='#affected+inneed+pct') {
          if (val!='No Data') {
            content += currentIndicator.name + ':<div class="stat">' + val + '</div>';
          }

          content += '<div class="table-display">';
          if (country_code=='COL') {
            //hardcode PIN for COL
            content += '<div class="table-row">Refugees & Migrants:<span>1,700,000</span></div>';
          }
          else {
            var tableArray = [{label: 'People in Need', value: country[0]['#affected+inneed']},
                              {label: 'Refugees & Migrants', value: country[0]['#affected+refugees']},
                              {label: 'IDPs', value: country[0]['#affected+displaced']}];
            tableArray.forEach(function(row, index) {
              if (row.value!=undefined) {
                content += '<div class="table-row"><div>'+ row.label +':</div><div>'+ numFormat(row.value) +'</div></div>';
              }
            });
          }
          content += '</div>';
        }
        //IPC layer
        else if (currentIndicator.id=='#affected+food+p3plus+num') {
          var dateSpan = '';
          if (country[0]['#date+ipc+start']!=undefined) {
            var startDate = new Date(country[0]['#date+ipc+start']);
            var endDate = new Date(country[0]['#date+ipc+end']);
            startDate = (startDate.getFullYear()==endDate.getFullYear()) ? d3.utcFormat('%b')(startDate) : d3.utcFormat('%b %Y')(startDate);
            var dateSpan = '<span class="subtext">('+ startDate +'-'+ d3.utcFormat('%b %Y')(endDate) +' - '+ country[0]['#date+ipc+period'] +')</span>';
          }
          var shortVal = (isNaN(val)) ? val : shortenNumFormat(val);
          content += 'Total Population in IPC Phase 3+ '+ dateSpan +':<div class="stat">' + shortVal + '</div>';
          if (val!='No Data') {
            if (country[0]['#affected+food+analysed+num']!=undefined) content += '<span>('+ shortenNumFormat(country[0]['#affected+food+analysed+num']) +' of total country population analysed)</span>';
            var tableArray = [{label: 'IPC Phase 3 (Critical)', value: country[0]['#affected+food+p3+num']},
                              {label: 'IPC Phase 4 (Emergency)', value: country[0]['#affected+food+p4+num']},
                              {label: 'IPC Phase 5 (Famine)', value: country[0]['#affected+food+p5+num']}];
            content += '<div class="table-display">Breakdown:';
            tableArray.forEach(function(row) {
              if (row.value!=undefined) {
                var shortRowVal = (row.value==0) ? 0 : shortenNumFormat(row.value);
                content += '<div class="table-row"><div>'+ row.label +':</div><div>'+ shortRowVal +'</div></div>';
              }
            });
            content += '</div>';
          }
        }
        //INFORM layer
        else if (currentIndicator.id=='#severity+inform+type') {
          var numVal = (isVal(country[0]['#severity+inform+num'])) ? country[0]['#severity+inform+num'] : 'No Data';
          var informClass = country[0]['#severity+inform+type'];
          var informTrend = country[0]['#severity+inform+trend'];
          content += 'INFORM Severity Index: <div><span class="stat">' + numVal + '</span> <span class="subtext inline">(' + informClass + ' / ' + informTrend + ')</span></div>';
        }
        //Humanitarian Funding Level layer
        else if (currentIndicator.id=='#value+funding+hrp+pct') {
          if (val!='No Data') {
            content +=  currentIndicator.name + ':<div class="stat">' + val + '</div>';
            var tableArray = [{label: 'HRP Requirement', value: country[0]['#value+funding+hrp+required+usd']}];
            content += '<div class="table-display">';
            tableArray.forEach(function(row) {
              if (isVal(row.value)) {
                content += '<div class="table-row"><div>'+ row.label +':</div><div>'+ formatValue(row.value) +'</div></div>';
              }
            });
            content += '</div>';
          }
          else {
            if (isVal(country[0]['#value+funding+other+plan_name'])) {
              var planArray = country[0]['#value+funding+other+plan_name'].split('|');
              var planPctArray = (isVal(country[0]['#value+funding+other+pct'])) ? country[0]['#value+funding+other+pct'].split('|') : [0];
              var planRequiredArray = (isVal(country[0]['#value+funding+other+required+usd'])) ? country[0]['#value+funding+other+required+usd'].split('|') : [0];
              var planTotalArray = (isVal(country[0]['#value+funding+other+total+usd'])) ? country[0]['#value+funding+other+total+usd'].split('|') : [0];

              if (val!='No Data') content += '<br/>';
              planArray.forEach(function(plan, index) {
                content +=  plan +' Funding Level:<div class="stat">' + percentFormat(planPctArray[index]) + '</div>';
                content += '<div class="table-display">';
                content += '<div class="table-row"><div>Requirement:</div><div>'+ formatValue(planRequiredArray[index]) +'</div></div>';
                content += '<div class="table-row"><div>Total:</div><div>'+ formatValue(planTotalArray[index]) +'</div></div>';
                content += '</div>';
                if (planArray.length>1) content += '<br/>';
              });
            }
            else {
              content +=  currentIndicator.name + ':<div class="stat">N/A</div>';
            }
          }
        }
        //all other layers
        else {
          content += currentIndicator.name + ':<div class="stat">' + val + '</div>';
        }

        //set content for tooltip
        tooltip.setHTML(content);
      }
      lastHovered = country_code;

      setTooltipPosition(point);
  }
}

function setTooltipPosition(point) {
  var tooltipWidth = $('.map-tooltip').width();
  var tooltipHeight = $('.map-tooltip').height();
  var anchorDirection = (point.x + tooltipWidth > viewportWidth) ? 'right' : 'left';
  var yOffset = 0;
  if (point.y + tooltipHeight/2 > viewportHeight) yOffset = viewportHeight - (point.y + tooltipHeight/2);
  if (point.y - tooltipHeight/2 < 0) yOffset = tooltipHeight/2 - point.y;
  var popupOffsets = {
    'right': [0, yOffset],
    'left': [0, yOffset]
  };
  tooltip.options.offset = popupOffsets;
  tooltip.options.anchor = anchorDirection;

  if (yOffset>0) {
    $('.mapboxgl-popup-tip').css('align-self', 'flex-start');
    $('.mapboxgl-popup-tip').css('margin-top', point.y);
  }
  else if (yOffset<0)  {
    $('.mapboxgl-popup-tip').css('align-self', 'flex-end');
    $('.mapboxgl-popup-tip').css('margin-bottom', viewportHeight-point.y-10);
  }
  else {
    $('.mapboxgl-popup-tip').css('align-self', 'center');
    $('.mapboxgl-popup-tip').css('margin-top', 0);
    $('.mapboxgl-popup-tip').css('margin-bottom', 0);
  }
}


function createCountryMapTooltip(adm1_name) {
  var adm1 = subnationalData.filter(function(c) {
    if (c['#adm1+name']==adm1_name && c['#country+code']==currentCountry.code)
      return c;
  });

  if (adm1[0]!=undefined) {
    var val = adm1[0][currentCountryIndicator.id];

    //format content for tooltip
    if (val!=undefined && val!='' && !isNaN(val)) {
      if (currentCountryIndicator.id.indexOf('pct')>-1) val = (val>1) ? percentFormat(1) : percentFormat(val);
      if (currentCountryIndicator.id=='#population' || currentCountryIndicator.id=='#affected+food+ipc+p3plus+num' || currentCountryIndicator.id=='#affected+ch+food+p3plus+num') val = shortenNumFormat(val);
      if (currentCountryIndicator.id=='#affected+idps+ind') val = numFormat(val);
    }
    else {
      val = 'No Data';
    }
    var content = '<h2>' + adm1_name + '</h2>' + currentCountryIndicator.name + ':<div class="stat">' + val + '</div>';
    tooltip.setHTML(content);
  }
}


function resetMap() {
  if (currentCountry.code!=undefined) {
    var id = currentCountry.code.toLowerCase()
    map.setLayoutProperty(id+'-popdensity', 'visibility', 'none');
  }
  map.setLayoutProperty(countryBoundaryLayer, 'visibility', 'none');
  map.setLayoutProperty(countryLayer, 'visibility', 'none');
  map.setLayoutProperty(countryLabelLayer, 'visibility', 'none');
  $('.content').removeClass('country-view');
  $('.country-select').val('');

  //reset region
  if (currentRegion!='') {
    selectRegion();
    map.setLayoutProperty(globalLayer, 'visibility', 'visible');
  }
  else {
    updateGlobalLayer();

    map.flyTo({ 
      speed: 2,
      zoom: zoomLevel,
      center: [centerLon, centerLat] 
    });
    map.once('moveend', function() {
      map.setLayoutProperty(globalLayer, 'visibility', 'visible');
    });
  }
}

