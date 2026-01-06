export function sec_to_time(totalSeconds, am = true) {
    
  if(totalSeconds > 0){

  let Bighours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = totalSeconds % 60;
  let am_pm = (Bighours < 12) ? 'AM' : 'PM';
  let hours = Bighours % 12 || 12;
  
  // If you want strings with leading zeroes:
  minutes = String(minutes).padStart(2, "0");
  Bighours = String(Bighours).padStart(2, "0");
  seconds = String(seconds).padStart(2, "0");
  

    if(am === true){
      return hours + ':' + minutes + ':' + seconds + ' ' + am_pm;

    } else {

      return Bighours + ':' + minutes + ':' + seconds;

    }

  }
  else{
    return '-';
  }
  }