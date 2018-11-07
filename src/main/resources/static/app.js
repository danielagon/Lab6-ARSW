var app = (function () {

    class Point{
        constructor(x,y){
            this.x=x;
            this.y=y;
        }        
    }
    
    var stompClient = null;
    
    var identifier = 0;

    var addPointToCanvas = function (point) {        
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
        //creando un objeto literal
        stompClient.send("/topic/newpoint", {}, JSON.stringify(point));
    };
    
    var addPolygonToCanvas = function (points) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        //ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.moveTo(points['1'].x, points['1'].y);
        ctx.lineTo(points['2'].x, points['2'].y);
        ctx.lineTo(points['3'].x, points['3'].y);
        ctx.lineTo(points['4'].x, points['4'].y);
        ctx.closePath();
        ctx.fill();
        stompClient.send("/topic/newpolygon."+identifier, {}, JSON.stringify(points));
    };
    
    
    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };


    var connectAndSubscribe = function () {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);
        
        //subscribe to /topic/TOPICXX when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/topic/newpoint', function (eventbody) {
                var event = JSON.parse(eventbody.body);
                //alert("X: "+event.x+", Y: "+event.y);
                addPointToCanvas(event);
            });
        });

    };
    
    var connectAndSubscribeById = function (id){
        identifier = id;
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);
        
        //subscribe to /topic/TOPICXX when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/topic/newpoint.'+id, function (eventbody) {
                var event = JSON.parse(eventbody.body);
                //alert("X: "+event.x+", Y: "+event.y);
                var canvas = document.getElementById("canvas");
                var ctx = canvas.getContext("2d");
                ctx.beginPath();
                ctx.arc(event.x, event.y, 3, 0, 2 * Math.PI);
                ctx.stroke();
            });
            stompClient.subscribe('/topic/newpolygon.'+id, function (eventbody){
                var polygon = JSON.parse(eventbody.body);
                addPolygonToCanvas(polygon);
            });
        });
    };
    
    

    return {

        init: function () {
            var can = document.getElementById("canvas");
            can.setAttribute("width",screen.width);
            
            $(can).click( function (e){
                var pt = new Point(getMousePosition(e).x,getMousePosition(e).y);
                console.info("publishing point at "+pt);
                addPointToCanvas(pt);
            });
            
            //websocket connection
            connectAndSubscribe();
        },
        
        connectById: function (id){
            var can = document.getElementById("canvas");
            
            connectAndSubscribeById(id);
        },

        publishPoint: function(px,py){
            var pt=new Point(px,py);
            console.info("publishing point at "+pt);
            addPointToCanvas(pt);
            //publicar el evento
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            setConnected(false);
            console.log("Disconnected");
        }
    };

})();