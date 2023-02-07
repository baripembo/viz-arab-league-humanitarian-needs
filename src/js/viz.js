var numFormat = d3.format(',');
var shortenNumFormat = d3.format('.2s');
var percentFormat = d3.format('.1%');
var dateFormat = d3.utcFormat("%b %d, %Y");
var chartDateFormat = d3.utcFormat("%-m/%-d/%y");
var colorRange = ['#F7DBD9', '#F6BDB9', '#F5A09A', '#F4827A', '#F2645A'];
var informColorRange = ['#FFE8DC','#FDCCB8','#FC8F6F','#F43C27','#961518'];
var populationColorRange = ['#FFE281','#FDB96D','#FA9059','#F27253','#E9554D'];
var accessColorRange = ['#79B89A','#F6B98E','#C74B4F'];
var oxfordColorRange = ['#ffffd9','#c7e9b4','#41b6c4','#225ea8','#172976'];
var schoolClosureColorRange = ['#D8EEBF','#FFF5C2','#F6BDB9','#CCCCCC'];
var colorDefault = '#F2F2EF';
var colorNoData = '#FFF';
var regionBoundaryData, regionalData, worldData, nationalData, subnationalData, subnationalDataByCountry, dataByCountry, countriesByRegion, colorScale, viewportWidth, viewportHeight, currentRegion = '';
var countryTimeseriesChart = '';
var mapLoaded = false;
var dataLoaded = false;
var viewInitialized = false;
var zoomLevel = 2.7;
var centerLon = 20;
var centerLat = 20;

var hrpData = [];
var globalCountryList = [];
var currentIndicator = {};
var currentCountryIndicator = {};
var currentCountry = {};

$( document ).ready(function() {
  var prod = (window.location.href.indexOf('ocha-dap')>-1 || window.location.href.indexOf('data.humdata.org')>-1) ? true : false;
  //console.log(prod);

  mapboxgl.accessToken = 'pk.eyJ1IjoiaHVtZGF0YSIsImEiOiJjbDFmN3FhaWcweXg2M3BueGtxZTg4eHQ3In0.IFj31j7clZPWhveCm5kAng';
  var tooltip = d3.select('.tooltip');
  var minWidth = 1000;
  viewportWidth = (window.innerWidth<minWidth) ? minWidth - $('.content-left').innerWidth() : window.innerWidth - $('.content-left').innerWidth();
  viewportHeight = window.innerHeight;


  function init() {
    //detect mobile users
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
      $('.mobile-message').show();
    }
    $('.mobile-message').on('click', function() {
      $(this).remove();
    });

    //set content sizes based on viewport
    $('.secondary-panel').height(viewportHeight-40);
    $('.content').width(viewportWidth + $('.content-left').innerWidth());
    $('.content').height(viewportHeight);
    $('.content-right').width(viewportWidth);
    $('.country-panel .panel-content').height(viewportHeight - $('.country-panel .panel-content').position().top);
    $('.map-legend.global, .map-legend.country').css('max-height', viewportHeight - 200);
    // if (viewportHeight<696) {
    //   zoomLevel = 1.4;
    // }

    //load static map -- will only work for screens smaller than 1280
    if (viewportWidth<=1280) {
      var staticURL = `https://api.mapbox.com/styles/v1/humdata/ckyw4l9z9002f14p3cyt9g2t0/static/${centerLon},${centerLon},${zoomLevel}/${viewportWidth}x${viewportHeight}?access_token=${mapboxgl.accessToken}`;
      $('#static-map').css('background-image', 'url('+staticURL+')');
    }

    getData();
    initMap();
  }

  function getData() {
    console.log('Loading data...')
    Promise.all([
      d3.json('https://raw.githubusercontent.com/OCHA-DAP/hdx-scraper-arableague-viz/main/all.json'),
      d3.json('data/ocha-regions-bbox.geojson')
    ]).then(function(data) {
      console.log('Data loaded');
      $('.loader span').text('Initializing map...');


      //parse data
      var allData = data[0];
      worldData = allData.allregions_data[0];
      regionBoundaryData = data[1].features;
      regionalData = allData.regional_data;
      nationalData = allData.national_data;
      subnationalData = allData.subnational_data;
      sourcesData = allData.sources_data;
      
      //format data
      subnationalData.forEach(function(item) {
        var pop = item['#population'];
        if (item['#population']!=undefined) item['#population'] = parseInt(pop.replace(/,/g, ''), 10);
        item['#org+count+num'] = +item['#org+count+num'];
      });

      //parse national data
      nationalData.forEach(function(item) {
        //normalize country names
        if (item['#country+name']=='State of Palestine') item['#country+name'] = 'occupied Palestinian territory';

        //calculate and inject PIN percentage
        item['#affected+inneed+pct'] = (item['#affected+inneed']=='' || item['#population']=='') ? '' : item['#affected+inneed']/item['#population'];
        
        //select CH vs IPC data
        var ipcParams = ['+analysed+num','+p3+num','+p3plus+num','+p4+num','+p5+num']
        var ipcPrefix = '#affected+food+ipc';
        var chPrefix = '#affected+ch+food';
        ipcParams.forEach(function(param) {
          if (item[ipcPrefix+param] || item[chPrefix+param]) {
            item['#affected+food'+param] = (item[chPrefix+param]) ? item[chPrefix+param] : item[ipcPrefix+param];
          }
        });

        //keep global list of countries
        globalCountryList.push({
          'name': item['#country+name'],
          'code': item['#country+code']
        });
        globalCountryList.sort(function(a,b) {
          return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0;
        });
      });

      //group national data by country -- drives country panel    
      dataByCountry = d3.nest()
        .key(function(d) { return d['#country+code']; })
        .object(nationalData);

      //consolidate subnational IPC data
      subnationalDataByCountry = d3.nest()
        .key(function(d) { return d['#country+code']; })
        .entries(subnationalData);

      subnationalDataByCountry.forEach(function(country) {
        var index = 0;
        var ipcEmpty = false;
        var chEmpty = false;
        //check first two data points to choose btwn IPC and CH datasets
        for (var i=0; i<2; i++) {
          var ipcVal = country.values[i]['#affected+food+ipc+p3plus+num'];
          var chVal = country.values[i]['#affected+ch+food+p3plus+num'];
          if (i==0 && (!isVal(ipcVal) || isNaN(ipcVal))) {
            ipcEmpty = true;
          }
          if (i==1 && ipcEmpty && isVal(ipcVal) && !isNaN(ipcVal)) {
            ipcEmpty = false;
          }
          if (i==0 && (!isVal(chVal) || isNaN(chVal))) {
            chEmpty = true;
          }
          if (i==1 && chEmpty && isVal(chVal) && !isNaN(chVal)) {
            chEmpty = false;
          }
        }
        //default to ipc source if both ipc and ch are empty
        country['#ipc+source'] = (!ipcEmpty || chEmpty && ipcEmpty) ? '#affected+food+ipc+p3plus+num' : '#affected+ch+food+p3plus+num';
      });

      //group countries by region    
      countriesByRegion = d3.nest()
        .key(function(d) { return d['#region+name']; })
        .object(nationalData);

      dataLoaded = true;
      if (mapLoaded==true) displayMap();
      initView();
    });
  }

  function initView() {
    //create regional select
    $('.region-select').empty();
    var regionalSelect = d3.select('.region-select')
      .selectAll('option')
      .data(regionalList)
      .enter().append('option')
        .text(function(d) { return d.name; })
        .attr('value', function (d) { return d.id; });
    //insert default option    
    $('.region-select').prepend('<option value="">All Regions</option>');
    $('.region-select').val($('.region-select option:first').val());

    //create hrp country select
    var countryArray = Object.keys(countryCodeList);
    hrpData = nationalData.filter((row) => countryArray.includes(row['#country+code']));

    hrpData.sort(function(a, b){
      return d3.ascending(a['#country+name'].toLowerCase(), b['#country+name'].toLowerCase());
    })
    var countrySelect = d3.select('.country-select')
      .selectAll('option')
      .data(hrpData)
      .enter().append('option')
        .text(function(d) { return d['#country+name']; })
        .attr('value', function (d) { return d['#country+code']; });
    //insert default option    
    $('.country-select').prepend('<option value="">View Country Page</option>');
    $('.country-select').val($('.country-select option:first').val());

    // //set daily download date
    // var today = new Date();
    // $('.download-link .today-date').text(dateFormat(today));
    // $('.download-daily').on('click', function() {  
    //   //mixpanel event
    //   mixpanel.track('link click', {
    //     'embedded in': window.location.href,
    //     'destination url': $(this).attr('href'),
    //     'link type': 'download report',
    //     'page title': document.title
    //   });

    //   //google analytics event
    //   gaTrack('oad covid-19 link', $(this).attr('href'), 'download report', document.title);
    // });

    // //show/hide NEW label for monthly report
    // sourcesData.forEach(function(item) {
    //   if (item['#indicator+name']=='#meta+monthly+report') {
    //     var today = new Date();
    //     var newDate = new Date(item['#date'])
    //     newDate.setDate(newDate.getDate() + 7) //leave NEW tag up for 1 week
    //     if (today > newDate)
    //       $('.download-monthly').find('label').hide()
    //     else
    //       $('.download-monthly').find('label').show()
    //   }
    // })

    //track monthly pdf download
    // $('.download-monthly').on('click', function() {  
    //   //mixpanel event
    //   mixpanel.track('link click', {
    //     'embedded in': window.location.href,
    //     'destination url': $(this).attr('href'),
    //     'link type': 'download report',
    //     'page title': document.title
    //   });

    //   //google analytics event
    //   gaTrack('arab league link', $(this).attr('href'), 'download report', document.title);
    // });

    //check map loaded status
    if (mapLoaded==true && viewInitialized==false)
      deepLinkView();

    viewInitialized = true;
  }


  function initCountryView() {
    $('.content').addClass('country-view');
    $('.country-panel').scrollTop(0);
    $('#population').prop('checked', true);
    currentCountryIndicator = {id: $('input[name="countryIndicators"]:checked').val(), name: $('input[name="countryIndicators"]:checked').parent().text()};

    initCountryPanel();
  }


  function initTracking() {
    //initialize mixpanel
    var MIXPANEL_TOKEN = window.location.hostname=='data.humdata.org'? '5cbf12bc9984628fb2c55a49daf32e74' : '99035923ee0a67880e6c05ab92b6cbc0';
    mixpanel.init(MIXPANEL_TOKEN);
    mixpanel.track('page view', {
      'page title': document.title,
      'page type': 'datavis'
    });
  }

  init();
  initTracking();
});