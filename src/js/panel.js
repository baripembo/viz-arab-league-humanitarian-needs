/***********************/
/*** PANEL FUNCTIONS ***/
/***********************/
function initCountryPanel() {
  var data = dataByCountry[currentCountry.code][0];

  //set panel header
  $('.flag').attr('src', 'assets/flags/'+data['#country+code']+'.png');
  $('.country-panel h3').text(data['#country+name']);

 //hrp
  var hrpDiv = $('.country-panel .hrp .panel-inner');
  hrpDiv.children().remove();
  createFigure(hrpDiv, {className: 'funding-required', title: 'HRP Requirement', stat: formatValue(data['#value+funding+hrp+required+usd']), indicator: '#value+funding+hrp+required+usd'});
  createFigure(hrpDiv, {className: 'funding-cerf-allocation', title: 'CERF Allocation 2023', stat: formatValue(data['#value+cerf+funding+total+usd']), indicator: '#value+cerf+funding+total+usd'});
  createFigure(hrpDiv, {className: 'funding-cbpf-allocation', title: 'CBPF Allocation 2023', stat: formatValue(data['#value+cbpf+funding+total+usd']), indicator: '#value+cbpf+funding+total+usd'});
  //createFigure(hrpDiv, {className: 'funding-paid-contributions', title: 'Paid Contributions', stat: formatValue(data['#value+cerf+contributions+total+usd']), indicator: '#value+cerf+contributions+total+usd'});

  //inform
  var informDiv = $('.country-panel .inform .panel-inner');
  informDiv.children().remove();  
  createFigure(informDiv, {className: 'risk-index', title: 'Risk Index<br>(1-10)', stat: data['#severity+inform+num'], indicator: '#severity+inform+num'});
  createFigure(informDiv, {className: 'risk-class', title: 'Risk Class<br>(Very Low-Very High)', stat: data['#severity+inform+type'], indicator: '#severity+inform+num'});
}

function createFigure(div, obj) {
  div.append('<div class="figure '+ obj.className +'"><div class="figure-inner"></div></div>');
  var divInner = $('.'+ obj.className +' .figure-inner');
  if (obj.title != undefined) divInner.append('<h6 class="title">'+ obj.title +'</h6>');
  divInner.append('<p class="stat">'+ obj.stat +'</p>');

  createSource(divInner, obj.indicator);
}
