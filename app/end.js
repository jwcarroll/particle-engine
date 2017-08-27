    
            var canvas = document.getElementById('world1');
            canvas.height = window.innerHeight;
            canvas.width = window.innerWidth;
            
            var context = canvas.getContext('2d');
            
            i = 0;
            
            setInterval(function(){    
            
                context.fillStyle = "white";
                context.fillRect(0, 0, canvas.width, canvas.height);

                context.fillStyle = "black";                
                
                context.beginPath();
                context.arc(i, i, 5, 0, Math.PI * 2, true);
                context.closePath();
                context.fill();
                
                i = i + 10;
                
            }, 1);
          