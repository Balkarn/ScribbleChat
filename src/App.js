import React, { useEffect, useState } from "react";
import socketIOClient from "socket.io-client";
import './style.css';
import { TextField, Button } from '@material-ui/core';
import SendIcon from '@material-ui/icons/Send';
import DeleteIcon from '@material-ui/icons/Delete';

//const ENDPOINT = "http://127.0.0.1:4001"; //for local testing
const ENDPOINT = "https://scribblechat-server.herokuapp.com/"; //for heroku testing

const socket = socketIOClient(ENDPOINT); //connect socketio client to endpoint

//Empty canvas png for comparing content (firefox)
const emptyMessage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAApoAAACSCAYAAADlwGq7AAABkElEQVR4nO3BgQAAAADDoPlTn+AGVQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAPwLQABs882JgAAAABJRU5ErkJggg=="

/* The loginscreen component for the app
 * User inputs their name and the server is contacted to make sure its not a duplicate of who's currently online
*/
export default function LoginScreen() {

  const [textfieldValue,setTextfieldValue] = React.useState('');
  const [error,setError] = React.useState(true); //Error boolean
  const [isLoggedIn,setIsLoggedIn] = React.useState(false);
  const [nameDuplicate,setNameDuplicate] = React.useState(false);
  const [takenName,setTakenName] = React.useState(''); //Stores the name that was already taken

  //Called only once on component mount
  useEffect(() => {

    //Listens for a message from the server asking for a new name
    socket.on("nameAgain", data => {
      setNameDuplicate(true);
      setTakenName(data);
    });

    //Listens for a message from the server saying the name is valid
    socket.on("nameValid", data => {
      setNameDuplicate(false);
      setIsLoggedIn(true);
    });

  }, []);

  //Function called whenever the textfield is changed
  const handleTextfield = event => {
    var eventVal = event.target.value; //setting a state isn't synchronous so store value in a temp variable
    setTextfieldValue(eventVal);
    setError(eventVal.length == 0 || eventVal.length > 20);
  }

  //Function when the send button is clicked
  const sendValue = () => {
    if (error) {
      setIsLoggedIn(false);
    } else {
      socket.emit('tryName',textfieldValue)//If the names valid send it to the server to see if it is a duplicate
    }
  }

  if (isLoggedIn) { //If the user has logged in render the main component

    return (<MainComponent name={textfieldValue}/>);

  } else { //Otherwise render the login screen

    //Login screen consists of the title component, a textfield form, a send button.  If there is an error that is displayed under the textfield.
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
        {nameDuplicate ? <p>Sorry the name {takenName} is taken!</p> : null }
      </div>
    );
  }
}

/* The main component for the app
 * Shows the messages as they are recieved from the server along with any status messages (eg user Joined/Left)
 * Has the canvas for the user to draw on and additional controls
 * @param name is the name of the user input previously
*/
const MainComponent = ({name}) => {

  const [responses, setResponses] = React.useState([]); //Array of responses from server
  
  //Called when data is recieved from the canvas component
  function recieveDataFromCanvas(data) {
    socket.emit('sendMessage',{user:name,message:data}) //Send message to the server
  }

  //Called once when the component is mounted, the return statement is called when the component is unmounted
  useEffect(() => {

    console.log("component mounted");
    socket.emit('requestCurrentlyOnline',name); //Ask the server for everyone online

    setResponses(responses => [...responses, {type:"join",value:"Welcome "+name+"!"}]); //Add welcome message to responses
    
    //When a message is recieved from the server append the name and message to the responses array
    socket.on("recieveMessage", data => {
      setResponses(responses => [...responses, { type: "user", value:data.user}]);
      setResponses(responses => [...responses, { type: "message", value:data.message}]);
    });

    //When the server sends the userJoined event display it in responses
    socket.on("userJoined", data => {
      setResponses(responses => [...responses, { type: "join", value: data + " joined!" }]);
    });

    //When the server sends the userLeft event display it in responses
    socket.on("userLeft", data => {
      setResponses(responses => [...responses, { type: "leave", value: data + " left." }]);
    });

    //When the server sends the currentlyOnline event display the list of everyone online in responses
    socket.on("currentlyOnline", data => {
      setResponses(responses => [...responses, { type: "online", value: data}]);
    });

    return () => socket.disconnect(); //Close connection when component unmounts

  }, []);

  //Called when the component is mounted and whenever the responses state array is updated.  Scrolls the scrollable div to the bottom.  
  useEffect(() => {
    document.getElementById("scrolldiv").scrollTop = document.getElementById("scrolldiv").scrollHeight;
  }, [responses]);

  //Displays the comonent: consists of a title, the list of messages in the responses array, and the canvas component for the user input.
  return (
    <div className="app">
      <Title /> {/*title component*/}
      <div id="scrolldiv" className = "list">
        <ul className ="listcomponent">
          {responses.map(aResponse => ShowMessage(aResponse,name)) /*For each response call the ShowMessage function*/}
        </ul>
      </div>
      <CanvasBox sendDataFromCanvas={recieveDataFromCanvas} /> {/*drawing canvas component*/}
    </div>
  );
}

/* Function to render each message that can be recieved from the server depending on the type of message
 * @param data has 2 componenets: the type of message to be rendered and the value
*/
const ShowMessage = (data) => {
  if (data.type=="message") {
    return (
      <li>
        <img src={data.value}></img> {/*Display an image with the source as the image data URI*/}
      </li>
    );
  } else if (data.type=="join") {
    return (
      <li>
        <p className="joinmsg">{data.value}</p>
      </li>
    );
  } else if (data.type=="user") {
    return (
      <li>
        <p className="name">{data.value}</p>
      </li>
    );
  } else if (data.type=="leave") {
    return (
      <li>
        <p className="leavemsg">{data.value}</p>
      </li>
    );
  } else if (data.type=="online") {
    return (
      <li>
        <p className="name">{data.value}</p>
      </li>
    );
  }
}

//Function to render the title componenet
const Title = () => {
  return (
    <div>
      <p className="title">ScribbleChat</p>
    </div>
  );
}

/* Renders the Canvas component
 * @param sendDataFromCanvas is the function in the parent component which allows the child-component to send up the data drawn on the canvas 
*/
const CanvasBox = ({sendDataFromCanvas}) => {

  const canvasRef = React.useRef(null); //reference to canvas
  const [context, setContext] = React.useState(null); //context of canvas

  //Function is called when the component is mounted and every render if the context state is updated, which contains the info about the canvas.
  React.useEffect(() => {

    //Changes the stored offset values everytime the window is resized
    function handleResize() {
      canvasOffsetLeft = canvasRef.current.offsetLeft;
      canvasOffsetTop = canvasRef.current.offsetTop;
    }
    
    window.addEventListener('resize', handleResize.bind(this)); //Event to listen for window resize

    //Mouse variables
    let mouseDown = false;
    let start = { x: 0, y: 0 };
    let end = { x: 0, y: 0 };
    let canvasOffsetLeft = 0;
    let canvasOffsetTop = 0;

    //Function called when the mouse is clicked
    function handleMouseDown(event) {
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

    //Record when mouse up
    function handleMouseUp() {
      mouseDown = false;
    }

    //Record when the mouse has exit and reentered
    function handleMouseOver(event) {
      end = { 
        x: event.clientX - canvasOffsetLeft,
        y: event.clientY - canvasOffsetTop,
      };
    }

    //Function called whenever the mouse is moved
    function handleMouseMove(event) {
      if (mouseDown && context) { //if mouse down and canvas exists
        start = { //Record coordinates mouse moved between
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

    //If the canvas reference exists
    if (canvasRef.current) {
      const renderCtx = canvasRef.current.getContext('2d'); //2d drawing canvas

      if (renderCtx) {
        document.addEventListener('mousedown', handleMouseDown); //listen for mouse events
        document.addEventListener('mouseup', handleMouseUp);
        canvasRef.current.addEventListener('mousemove', handleMouseMove);
        canvasRef.current.addEventListener("mouseover", handleMouseOver);

        canvasOffsetLeft = canvasRef.current.offsetLeft; //set canvas offset to its location, as it is not at 0,0
        canvasOffsetTop = canvasRef.current.offsetTop;

        setContext(renderCtx);
      }
    }

    //Called when the componenet is unmounted
    return function cleanup() {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousedown', handleMouseDown); //Remove event listeners when no longer needed
        canvasRef.current.removeEventListener('mouseup', handleMouseUp);
        canvasRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    }
  }, [context]);

  //Clearcanvas function called when the clear button is pressed
  function clearcanvas() {
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }

  //Sendmessage function called when the send button is pressed
  function sendmessage() {

    var imagedataurl = document.getElementById('canvas').toDataURL(); //get image data as a data URI
    if (imagedataurl != emptyMessage) {
      sendDataFromCanvas(imagedataurl); //Call the sendDataFromCanvas function, which refers to the parent recieveDataFromCanvas function.
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); //Clear the canvas
    } else {
      console.log("Message not sent (spam)")
    }

  }

  //Renders the component, has the canvas horizontally next to the buttons which are laid out vertically
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


