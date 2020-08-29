import React, { useEffect, useState } from "react";
import socketIOClient from "socket.io-client";
import './style.css';
import { TextField, Button } from '@material-ui/core';
import SendIcon from '@material-ui/icons/Send';
import DeleteIcon from '@material-ui/icons/Delete';

const ENDPOINT = "http://127.0.0.1:4001"; //for local testing
//const ENDPOINT = "https://scribblechat-server.herokuapp.com/"; //for heroku testing

const socket = socketIOClient(ENDPOINT); //connect socketio clinent to endpoint

//Empty canvas png for comparing content
const emptyMessage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAApoAAACSCAYAAADlwGq7AAABkElEQVR4nO3BgQAAAADDoPlTn+AGVQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAPwLQABs882JgAAAABJRU5ErkJggg=="

export default function LoginScreen() {
  const [textfieldValue,setTextfieldValue] = React.useState('');
  const [error,setError] = React.useState(true);
  const [isLoggedIn,setIsLoggedIn] = React.useState(false);

  const handleTextfield = event => {
    var eventVal = event.target.value; //setting a state isn't synchronous so store value in a temp variable
    setTextfieldValue(eventVal);
    setError(eventVal.length == 0 || eventVal.length > 20);
  }

  const sendValue = () => {
    if (error) { //only log in if the username is valid
      setIsLoggedIn(false);
    } else {
      setIsLoggedIn(true);
    }
  }

  if (isLoggedIn) { //If the user has logged in render the main component

    return (<MainComponent name={textfieldValue}/>);

  } else { //otherwise render the login screen

    return(
      <div>
        <Title />
        <div className="form">
          <TextField
            font-size='16px'
            id='outlined-textarea'
            label='Username'
            placeholder='Write your name here'
            variant='outlined'
            onChange={handleTextfield}
            error={error}
            helperText={error ? 'Must be 1-20 Characters' : ' '}
          ></TextField>
        </div>
        <div className="form">
          <Button
            variant='contained'
            color='primary'
            size='medium'
            endIcon={<SendIcon />}
            onClick={sendValue}
          >
            Submit
          </Button>
        </div>
      </div>
    );
  }
}

const MainComponent = ({name}) => {
  const [responses, setResponses] = React.useState([]); //array of responses from server

  function recieveDataFromCanvas(data) {
    setResponses(responses => [...responses, data]); //append response to responses
  }

  useEffect(() => {

    console.log("component mounted");
    setResponses(responses => [...responses, name+" joined!"]); //Add welcome message to responses

    socket.on("FromAPI", data => {
      //setResponse(data);
      //setResponses(responses => [...responses, data]); //append response to responses
    });

    return () => socket.disconnect(); //close connection when component unmounts

  }, []);

  useEffect(() => {
    document.getElementById("scrolldiv").scrollTop = document.getElementById("scrolldiv").scrollHeight;
  }, [responses]);

  return (
    <div className="app">
      <Title /> {/*title component*/}
      <div id="scrolldiv" className = "list">
        <ul className ="listcomponent">
          {responses.map(aResponse => ShowMessage(aResponse,name)) /*For each response call the ShowMessage function and increase the messages count*/}
        </ul>
      </div>
      <CanvasBox sendDataFromCanvas={recieveDataFromCanvas} /> {/*drawing canvas component*/}
    </div>
  );
}

const ShowMessage = (data,name) => {
  if (data.length>50) {
    return (
      <li>
        <p className="name">{name}</p>
        <img src={data}></img> {/*Display an image with the source as the image data url*/}
      </li>
    );
  } else {
    return (
      <li>
        <p className="joinmsg">{data}</p>
      </li>
    );
  }
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
      if (context) {
        mouseDown = true;

        start = {
          x: event.clientX - canvasOffsetLeft,
          y: event.clientY - canvasOffsetTop,
        };

        end = {
          x: event.clientX - canvasOffsetLeft,
          y: event.clientY - canvasOffsetTop,
        };

        //Create a dot on the canvas
        context.beginPath();
        context.strokeStyle = '#000';
        context.lineWidth = 1;
        context.arc(start.x, start.y, 1, 0, 2 * Math.PI);
        context.stroke();
        context.closePath();
      }
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
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); //clear the canvas
  }

  function sendmessage() {
    var imagedataurl = document.getElementById('canvas').toDataURL(); //get image data as a data url
    if (imagedataurl != emptyMessage) {
      sendDataFromCanvas(imagedataurl);
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); //clear the canvas
    } else {
      console.log("Message not sent (spam)")
    }
  }


  return (
    <div>
      <div className="canvasholder">
        <canvas
          id="canvas"
          ref={canvasRef}
          width={666}
          height={146}
        ></canvas>
      </div>
      <div className="buttons">
        <div>
        <Button
          style={{ maxWidth: '50px', maxHeight: '75px', minWidth: '50px', minHeight: '75px' }}
          variant='contained'
          color='secondary'
          onClick={clearcanvas}
        >
          <DeleteIcon />
        </Button>
        </div>
        <div>
        <Button
          style={{ maxWidth: '50px', maxHeight: '75px', minWidth: '50px', minHeight: '75px' }}
          variant='contained'
          color='primary'
          onClick={sendmessage}
        >
          <SendIcon />
        </Button>
      </div>
      </div>
    </div>
  );
}


