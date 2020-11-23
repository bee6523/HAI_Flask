function next() {
  var step = $("li[class=is-active]");
  step.removeClass("is-active");
  step.addClass("is-complete");
  const num = parseInt(step.attr('data-step'))+1;
  console.log(num);
  const data = num<5? String(num) : "4";
  console.log(data);
  step = $('li[data-step='+data+']');
  console.log(step);
  step.addClass("is-active");
  window.location.href = '#/step'+data;
}
function prev() {
  var step = $("li[class=is-active");
  step.removeClass("is-active");
  const num = parseInt(step.attr('data-step'))-1;
  console.log(step.attr('data-step'));
  console.log(num);
  if (num == NaN) {
    window.location.href = '#/step3';
  } else {
  const data =  num !== 0 ? String(num) : "1";
  console.log(data);
  step = $('li[data-step='+data+']');
  step.removeClass("is-complete");
  step.addClass("is-active");
  window.location.href = '#/step'+data;
  }
}