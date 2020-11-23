
function next() {
  var step = $("li[class=is-active]");
  step.removeClass("is-active");
  step.addClass("is-complete");
  var num = parseInt(step.attr('data-step'))+1;
  console.log(num);
  var data = String(num);
  console.log(data);
  step = $('li[data-step='+data+']');
  console.log(step);
  step.addClass("is-active");
  window.location.href = '#/step'+data;
}
