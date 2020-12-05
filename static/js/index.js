function next() {
  var step = $("li.is-active");
  step.removeClass("is-active");
  step.addClass("is-complete");
  const num = parseInt(step.attr('data-step'))+1;
  const data = num<5? String(num) : "4";
  step = $('li[data-step='+data+']');
  step.addClass("is-active");
  window.location.href = '#/step'+data;
}
function prev() {
  var step = $("li.is-active");
  step.removeClass("is-active");
  const num = parseInt(step.attr('data-step'))-1;
  const data =  num !== 0 ? String(num) : "1";
  step = $('li[data-step='+data+']');
  step.removeClass("is-complete");
  step.addClass("is-active");
  window.location.href = '#/step'+data;
}