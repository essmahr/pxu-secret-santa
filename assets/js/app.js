var deadline = '2015-12-07';

function getTimeRemaining(endtime){
  var t = Date.parse(endtime) - Date.parse(new Date());
  var seconds = Math.floor( (t/1000) % 60 );
  var minutes = Math.floor( (t/1000/60) % 60 );
  var hours = Math.floor( (t/(1000*60*60)) % 24 );
  var days = Math.floor( t/(1000*60*60*24) );
  return {
    'total': t,
    'days': days,
    'hours': hours,
    'minutes': minutes,
    'seconds': seconds
  };
}

function initializeClock(el, endtime){
  updateClock(el, endtime);
  var timeinterval = setInterval(function(){
    updateClock(el, endtime);
  }, 1000);
}

function updateClock(el, endtime) {
  var t = getTimeRemaining(endtime);
  var dayLabel    = t.days    === 1 ? 'day,'    : 'days,';
  var hourLabel   = t.hours   === 1 ? 'hour,'   : 'hours,';
  var minuteLabel = t.minutes === 1 ? 'minute,' : 'minutes';
  var secondLabel = t.seconds === 1 ? 'second'  : 'seconds';

  var sentence = [
    'That\'s',
    t.days,
    dayLabel,
    t.hours,
    hourLabel,
    t.minutes,
    minuteLabel,
    'and',
    t.seconds,
    secondLabel,
    'away.'
  ];

  el.innerHTML = sentence.join(' ');
}

document.addEventListener("DOMContentLoaded", function() {
  var clock = document.getElementById("timer");
  var timeRemaining = getTimeRemaining(deadline);

  if (clock) {
    if (timeRemaining.total <= 0 ){
      clock.innerHTML = '<strong>Which has already passed, so we hope you\'ve gotten your gift!</strong>';
    } else {
      initializeClock(clock, deadline);
    }
  }
});
