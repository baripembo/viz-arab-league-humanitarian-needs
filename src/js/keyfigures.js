function setKeyFigures() {
	var secondaryPanel = $('.secondary-panel');
	var secondaryPanelSource = $('.secondary-panel .source-container');
	secondaryPanel.find('.figures, .source-container, .ranking-chart').empty();
	secondaryPanel.find('.source-container').show();

	//title
	secondaryPanel.find('.secondary-panel-title').html(currentIndicator.title);

	//source
	var indicator = currentIndicator.id;
	if (indicator=='#affected+inneed+pct') indicator = '#affected+inneed';
	createSource(secondaryPanelSource, indicator);

	//get regional data
	var data = worldData;
	if (currentRegion!='') {
		regionalData.forEach(function(d) {
			if (d['#region+name']==currentRegion) {
				data = d;
			}
		});
	}

	//tally countries with data
	var totalCountries = 0;
	nationalData.forEach(function(d) {
		if (regionMatch(d['#region+name'])) {
			var val = d[currentIndicator.id];
			if (currentIndicator.id=='#severity+inform+type') {
				if (val!=undefined)
					totalCountries++;
			}
			else {
				if (isVal(val) && !isNaN(val)) {
					totalCountries++;
				}
			}
		}
	});

	//PIN
	if (currentIndicator.id=='#affected+inneed+pct') {
		var affectedPIN = (data[indicator]==undefined) ? 0 : (d3.format('.4s'))(data[indicator]);
		createKeyFigure('.figures', 'Number of Countries', '', totalCountries);
		createKeyFigure('.figures', 'Total Number of People in Need', 'pin', affectedPIN);
	}
	//IPC
	else if (currentIndicator.id=='#affected+food+p3plus+num') {
		createKeyFigure('.figures', 'Number of Countries', '', totalCountries);
		var ipcTotal = (data['#affected+food+ipc+p3plus+num']==undefined) ? 0 : d3.format('.3s')(data['#affected+food+ipc+p3plus+num']);
		createKeyFigure('.figures', 'Total number of people in IPC 3+', '', ipcTotal);
	}
	//immunizations
	else if (currentIndicator.id=='#vaccination+postponed+num') {
		createKeyFigure('.figures', 'Number of Countries', '', totalCountries);
		var postponedNum = (data[indicator]==undefined) ? 0 : data[indicator];
		createKeyFigure('.figures', 'Total number of immunization campaigns postponed due to COVID', '', postponedNum);
	}
	//humanitarian funding
	else if (currentIndicator.id=='#value+funding+hrp+pct') {
		var numCountries = 0;
		nationalData.forEach(function(d) {
			if (regionMatch(d['#region+name'])) {
				numCountries++;
			}
		});
		createKeyFigure('.figures', 'Number of Countries', '', numCountries);
		createKeyFigure('.figures', 'Total Funding Required (GHO 2022)', '', formatValue(data['#value+funding+hrp+required+usd']));
		createKeyFigure('.figures', 'Total Funding Level', '', (data['#value+funding+hrp+required+usd']!=undefined) ? percentFormat(data['#value+funding+hrp+pct']) : 'NA');
	}
	//CERF
	else if (currentIndicator.id=='#value+cerf+funding+total+usd') {
		createKeyFigure('.figures', 'Number of Countries', '', totalCountries);
		if (data['#value+cerf+contributions+total+usd']!=undefined) createKeyFigure('.figures', 'Total Contribution', '', formatValue(data['#value+cerf+contributions+total+usd']));
		createKeyFigure('.figures', 'Total CERF Funding 2023', 'total-funding', formatValue(data['#value+cerf+funding+total+usd']));
		if (data['#value+cerf+funding+total+usd'] > 0) {
			var gmText = getGamText(data, 'cerf');
			$('.figures .key-figure .inner .total-funding').append('<div class="small">'+ gmText +'</div>');
		}
	}
	//CBPF
	else if (currentIndicator.id=='#value+cbpf+funding+total+usd') {
		//num countries
		createKeyFigure('.figures', 'Number of Countries', '', totalCountries);
		if (data['#value+cbpf+contributions+total+usd']!=undefined) createKeyFigure('.figures', 'Total Contribution', '', formatValue(data['#value+cbpf+contributions+total+usd']));
		createKeyFigure('.figures', 'Total CBPF Funding 2023', 'total-funding', formatValue(data['#value+cbpf+funding+total+usd']));
		
		//gam
		if (data['#value+cbpf+funding+total+usd'] > 0) {
			var gmText = getGamText(data, 'cbpf');
			$('.figures .key-figure .inner .total-funding').append('<div class="small">'+ gmText +'</div>');
		}

		//beneficieries
		if (data['#affected+cbpf+funding+total'] > 0) {
			var beneficiaryText = getBeneficiaryText(data);
			$('.figures .key-figure .inner').append('<div class="small">'+ beneficiaryText +'</div>');
		}

	}
	//IFI
	else if (currentIndicator.id=='#value+gdp+ifi+pct') {
		createKeyFigure('.figures', 'Number of Countries', '', totalCountries);
		createKeyFigure('.figures', 'Total Funding', '', formatValue(data['#value+ifi+total']));
	}
	else {
		//no global figures
		createKeyFigure('.figures', 'Number of Countries', '', totalCountries);
	}

	//ranking chart
	$('.ranking-container').show();
	createRankingChart();
}

function createKeyFigure(target, title, className, value) {
  var targetDiv = $(target);
  return targetDiv.append("<div class='key-figure'><div class='inner'><h3>"+ title +"</h3><div class='num " + className + "'>"+ value +"</div></div></div></div>");
}


/************************/
/*** SOURCE FUNCTIONS ***/
/************************/
function createSource(div, indicator) {
  var sourceObj = getSource(indicator);
  var date = (sourceObj['#date']==undefined) ? '' : dateFormat(new Date(sourceObj['#date']));
  var sourceName = (sourceObj['#meta+source']==undefined) ? '' : sourceObj['#meta+source'];
  var sourceURL = (sourceObj['#meta+url']==undefined) ? '#' : sourceObj['#meta+url'];
  div.append('<p class="small source"><span class="date">'+ date +'</span> | <span class="source-name">'+ sourceName +'</span> | <a href="'+ sourceURL +'" class="dataURL" target="_blank" rel="noopener">DATA</a></p>');
}

function updateSource(div, indicator) {
  var sourceObj = getSource(indicator);
  var date = (sourceObj['#date']==undefined) ? '' : dateFormat(new Date(sourceObj['#date']));
  var sourceName = (sourceObj['#meta+source']==undefined) ? '' : sourceObj['#meta+source'];
  var sourceURL = (sourceObj['#meta+url']==undefined) ? '#' : sourceObj['#meta+url'];
  div.find('.date').text(date);
  div.find('.source-name').text(sourceName);
  div.find('.dataURL').attr('href', sourceURL);
}

function getSource(indicator) {
  var isGlobal = ($('.content').hasClass('country-view')) ? false : true;
  var obj = {};
  sourcesData.forEach(function(item) {
    if (item['#indicator+name']==indicator) {
      obj = item;
    }
  });
  return obj;
}

