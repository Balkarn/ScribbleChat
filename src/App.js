import React, { useEffect, useState } from "react";
import socketIOClient from "socket.io-client";
import './style.css';

const ENDPOINT = "http://127.0.0.1:4001"; //for local testing
//const ENDPOINT = "https://scribblechat-server.herokuapp.com/"; //for heroku testing

const socket = socketIOClient(ENDPOINT); //connect socketio clinent to endpoint

export default function ClientComponent() {
  const [response, setResponse] = useState("");
  const [responses, setResponses] = useState([]); //array of responses from server

  function recieveDataFromCanvas(data) {
    setResponses(responses => [...responses, data]); //append response to responses
  }

  useEffect(() => {
    socket.on("FromAPI", data => {
      setResponse(data);
      //setResponses(responses => [...responses, data]); //append response to responses
    });

    return () => socket.disconnect(); //close connection when component unmounts

  }, []);

  return (
    <div className="app">
      <Title /> {/*title component*/}
      <div className = "list">
        <ul>
          {responses.map(aResponse => (
            <li><div>{aResponse}</div></li>
          ))}
        </ul>
      </div>
      <CanvasBox sendDataFromCanvas={recieveDataFromCanvas} /> {/*drawing canvas component*/}
    </div>
  );
}

const Title = () => {
  return (
    <div>
      <p className="title">ScribbleChat</p>
    </div>
  );
}

const CanvasBox = ({sendDataFromCanvas}) => {
  const canvasRef = React.useRef(null); //reference to canvas
  const [context, setContext] = React.useState(null); //context of canvas

  React.useEffect(() => {

    function handleResize() {
      canvasOffsetLeft = canvasRef.current.offsetLeft; //Change canvas offset when window resizes
      canvasOffsetTop = canvasRef.current.offsetTop;
    }
    
    window.addEventListener('resize', handleResize.bind(this)); //Event to listen for window resize

    let mouseDown = false; //mouse variables
    let start = { x: 0, y: 0 };
    let end = { x: 0, y: 0 };
    let canvasOffsetLeft = 0;
    let canvasOffsetTop = 0;

    function handleMouseDown(event) { //track the change in mouse coordinates when mouse down
      mouseDown = true;

      start = {
        x: event.clientX - canvasOffsetLeft,
        y: event.clientY - canvasOffsetTop,
      };

      end = {
        x: event.clientX - canvasOffsetLeft,
        y: event.clientY - canvasOffsetTop,
      };
    }

    function handleMouseUp() { //record when mouse up
      mouseDown = false;
    }
    
    function handleMouseOver(event) {
      end = { //record when the mouse has exit and reentered
        x: event.clientX - canvasOffsetLeft,
        y: event.clientY - canvasOffsetTop,
      };
    }

    function handleMouseMove(event) {
      if (mouseDown && context) { //if mouse down and canvas exists
        start = { //record coordinates mouse moved between
          x: end.x,
          y: end.y,
        };

        end = {
          x: event.clientX - canvasOffsetLeft,
          y: event.clientY - canvasOffsetTop,
        };

        // Draw mouse movement path
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        context.strokeStyle = '#000';
        context.lineWidth = 3;
        context.stroke();
        context.closePath();
      }
    }

    if (canvasRef.current) {
      const renderCtx = canvasRef.current.getContext('2d'); //2d drawing canvas

      if (renderCtx) {
        document.addEventListener('mousedown', handleMouseDown); //listen for events
        document.addEventListener('mouseup', handleMouseUp);
        canvasRef.current.addEventListener('mousemove', handleMouseMove);
        canvasRef.current.addEventListener("mouseover", handleMouseOver);

        canvasOffsetLeft = canvasRef.current.offsetLeft; //set canvas offset to its location, as it is not at 0,0
        canvasOffsetTop = canvasRef.current.offsetTop;

        setContext(renderCtx);
      }
    }

    return function cleanup() {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousedown', handleMouseDown); //remove event listeners when no longer needed
        canvasRef.current.removeEventListener('mouseup', handleMouseUp);
        canvasRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    }
  }, [context]);

  function clearcanvas() {
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }

  function sendmessage() {
    //var imgData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    sendDataFromCanvas("hi");
  }


  return (
    <div>
      <div className="canvasholder">
        <canvas
          id="canvas"
          ref={canvasRef}
          width={670}
          height={150}
        ></canvas>
      </div>
      <div className="buttons">
        <button className="clrbutton" onClick={clearcanvas}>
          Clear
        </button>
        <button className="sndbutton" onClick={sendmessage}>
          Send
        </button>
      </div>
    </div>
  );
}


