let port
let reader
let serial_params = {
    portReadedChars: 0,
    portWritedChars: 0,
}

async function con() {
    port = await navigator.serial.requestPort()
}

async function read() {
    reader = port.readable.getReader()
}

async function portnull() {
    port = null
}

async function readernull() {
    reader = mull
}
export {port, reader,serial_params, con,read, portnull, readernull}