export function percent(obj, session){
      
   

    const clockings = Object.values(obj).filter(function(value){ return value.session == session });
    
        let sum = 0;
        let sum_user = 0;
  
        for(let i = 0; i < clockings.length; i++){
          sum = clockings[i]['out'] - clockings[i]['in']
          sum_user = sum_user + sum
        }

          //if no session
          if(clockings.length < 1){
            return '';
          }

        const schedule_total = clockings[0]['schedule_total'];

       

        const percentage = sum_user / schedule_total * 100; 

        if(percentage > 100){
          return '<span style="color: white; background-color: black">' + Math.ceil(percentage) + '%</span>';

         }   else if (percentage < 80 && percentage > 30) {
          return '<span style="color: orange">' + Math.ceil(percentage) + '%</span>';

        }   else if (percentage < 31 && percentage > 0) {
          return '<span style="color: red">' + Math.ceil(percentage) + '%</span>';

        }   else if (percentage < 0) {
          return '⚠️';

         } else{
          return Math.ceil(percentage) + '%';
         }

         
}