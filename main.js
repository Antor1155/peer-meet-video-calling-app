// This part is for agora sdk 
let APP_ID = "c725ec6c683640dc8c2c2d87a383e599"

let token = null
let uid = String(Math.floor(Math.random() * 10000))

let client;
let channel;


// this part if for webRtc 
let localStream;
let remoteStream;
let peerConnection;

const servers = {
    iceServers : [
        {
            urls: ["stun:stun.l.google.com:19302", "stun:stun2.l.google.com:19302"]
        }
    ]
}

let init = async () =>{

     // ***********************
    // this part is for webRTC 
    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})

    document.getElementById("user-1").srcObject = localStream


    // this part is for agora sdk
    client = await AgoraRTM.createInstance(APP_ID)

    await client.login({uid, token})

    //index.html?room=234234
    channel = client.createChannel("main")
    await channel.join()

    channel.on("MemberJoined", handleUserJoined)

    // when a user gets a message 
    client.on('MessageFromPeer', handleMessgaeFromPeer)
    
}

const handleMessgaeFromPeer = async (message, memberId) =>{
    message = JSON.parse(message.text)

    console.log("message: ", message, "from: ", memberId)

}


let handleUserJoined = async (MemberId) =>{
    console.log("User joined: ", MemberId)

    createOffer(MemberId)

}


let createOffer = async (MemberId) =>{
    peerConnection = new RTCPeerConnection(servers)
    remoteStream = new MediaStream()

    document.getElementById("user-2").srcObject = remoteStream


    localStream.getTracks().forEach((track)=>{
        peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = (event) =>{
        event.streams[0].getTracks().forEach(track =>{
            remoteStream.addTrack(track)
        })
    }


    peerConnection.onicecandidate = async (event) =>{
        if(event.candidate){
            // console.log("New ice candidate :", event.candidate)
        }
    }


    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)



    // this part to send the offer to other user when connected 
    const message = JSON.stringify( {
        type: "offer",
        offer: offer
    })

    client.sendMessageToPeer({text: message}, MemberId)

    
}

init()