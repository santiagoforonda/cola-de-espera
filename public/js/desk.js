const lblPending = document.querySelector("#lbl-pending");
const deskHeader = document.querySelector("h1");
const noMoreAlert = document.querySelector(".alert");
const btnDraw = document.querySelector("#btn-draw");
const btnDone = document.querySelector("#btn-done");
const LblcurrentTicket = document.querySelector("small");

const searchParams = new URLSearchParams(window.location.search);

if(!searchParams.has("escritorio")){
  window.location="index.html";
  throw new Error("Escritorio es requerido");
}

const deskNumber = searchParams.get("escritorio");
let currentTicket = null;
deskHeader.innerText=deskNumber;


function checkTicketCount(initalCount=0){
  if(initalCount ===0){
    noMoreAlert.classList.remove("d-none");
  }else{
    noMoreAlert.classList.add("d-none");
  }
  
  lblPending.innerHTML=initalCount;
}

async function loadInitialCount(){
    const pending = await fetch("/api/ticket/pending").then(resp=>resp.json());
    checkTicketCount(pending.length);
}

async function getTicket(){
 
  await finishTicket();

  const {status,ticket,message} = await fetch(`/api/ticket/draw/${deskNumber}`).then(resp=>resp.json());

  if(status ==="error"){
    LblcurrentTicket.innerText=message;
  }

  currentTicket=ticket;
  LblcurrentTicket.innerText=ticket.number;
}


async function finishTicket(){
  if(!currentTicket){
    return;
  }

  const {status,message} = await fetch(`/api/ticket/done/${currentTicket.id}`,{
    method:"PUT"
  }).then(resp=>resp.json())

  if(status ==="ok"){
    currentTicket=null;
    LblcurrentTicket.innerText="No hay tickets";
  }

}

function connectToWebSockets() {

  const socket = new WebSocket( 'ws://localhost:3000/ws' );

  socket.onmessage = ( event ) => {
    console.log(event.data);
    const {type,payload} = JSON.parse(event.data);
    if(type !== "on-ticket-count-changed") return;
    checkTicketCount(payload);
  };

  socket.onclose = ( event ) => {
    console.log( 'Connection closed' );
    setTimeout( () => {
      console.log( 'retrying to connect' );
      connectToWebSockets();
    }, 1500 );

  };

  socket.onopen = ( event ) => {
    console.log( 'Connected' );
  };

}

btnDraw.addEventListener("click",getTicket);
btnDone.addEventListener("click",finishTicket);


loadInitialCount();
connectToWebSockets();


