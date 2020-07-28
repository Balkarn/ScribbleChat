import React, { useEffect, useState } from "react";
import socketIOClient from "socket.io-client";

const ENDPOINT = "http://127.0.0.1:4001"; //for local testing
//const ENDPOINT = "https://scribblechat-server.herokuapp.com/"; //for heroku testing

const socket = socketIOClient(ENDPOINT);

export default function ClientComponent() {
  const [response, setResponse] = useState("");
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    socket.on("FromAPI", data => {
      setResponse(data);
      setResponses(responses => [...responses, data]);
    });

    return () => socket.disconnect(); //close connection when component unmounts

  }, []);

  return (
    <ul>
      {responses.map(aResponse => (
        <li>{aResponse}</li>
      ))}
    </ul>
  );
}