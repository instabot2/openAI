import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
const messageWrapper = document.querySelector('#message_wrapper');

let loadInterval;

function loader(element) {
  element.textContent = '';
  loadInterval = setInterval(() => {
    // Update the text content of the loading indicator
    element.textContent += '.';
    // If the loading indicator has reached three dots, reset it
    if (element.textContent === '....') {
      element.textContent = '';
    }
  }, 300);
}

// generate unique ID for each message div of bot
// necessary for typing text effect for that specific reply
// without unique ID, typing text will work on every element
function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

function scrollIntoView(element, behavior = 'smooth', block = 'start') {
  element.scrollIntoView({
    behavior,
    block,
  });
}

function typeText(element, text, callback) {
  let index = 0;
  const intervalId = setInterval(() => {
    if (index < text.length) {
      element.insertAdjacentHTML('beforeend', text.charAt(index));
      index++;
      // Check if the element is already scrolled to the bottom and scroll it up
      if (element.scrollHeight - element.scrollTop === element.clientHeight) {
        element.scrollTop = element.scrollHeight;
      }
    } else {
      clearInterval(intervalId);
      if (callback) {
        callback();
      }
    }
  }, 20);
  // Add this line to clear the text before typing
  element.innerHTML = '';
}

function chatStripe(isAi, value, uniqueId) {
  return `
    <div class="wrapper ${isAi && 'ai'}">
      <div class="chat">
        <div class="profile">
          <img src=${isAi ? bot : user} alt="${isAi ? 'bot' : 'user'}"/>
        </div>
        <div class="message" id=${uniqueId}>${value}</div>
      </div>
    </div>
  `;
}

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  // Retrieve stored messages from local storage
  let messages = JSON.parse(localStorage.getItem('messages')) || [];

  // user's chatstripe
  const userMessage = chatStripe(false, data.get('prompt'));
  messageWrapper.insertAdjacentHTML('beforeend', userMessage);

  // to clear the textarea input
  form.reset();

  // bot's chatstripe
  const uniqueId = generateUniqueId();
  const botMessage = chatStripe(true, '', uniqueId);
  messageWrapper.insertAdjacentHTML('beforeend', botMessage);

  // specific message div
  const messageDiv = document.getElementById(uniqueId);
  loader(messageDiv);

  try {
    const response = await fetch('https://chatgpt-ai-lujs.onrender.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: data.get('prompt'),
      }),
    });

    clearInterval(loadInterval);
    messageDiv.innerHTML = '';

    if (response.ok) {
      const responseData = await response.json();
      const parsedData = responseData.bot.trim(); // trims any trailing spaces/'\n'
      typeText(messageDiv, parsedData, () => {
        // scroll to the new message
        scrollIntoView(messageDiv);

        // scroll to the top of the chat container to show the new message
        chatContainer.scrollTop = 0;

        // Store the message in local storage
        messages.push({ isBot: true, message: parsedData });
        localStorage.setItem('messages', JSON.stringify(messages));

        // Write the message to an XML file
        let messageXml;
        try {
          messageXml = `<message isBot="true">${parsedData}</message>`;
          window.alert(`writing message to file: ${messageXml}`);
          writeMessageToFile(true, messageXml);
        } catch (err) {
          console.error(err);
          window.alert(`Error in writing message to file 1: ${err.message}`);
        }
      });
    } else {
      const err = await response.text();
      throw new Error(`Error ${response.status}: ${err}`);
    }
  } catch (err) {
    messageDiv.innerHTML = err.message;
    console.error(err);
    window.alert(`console.error: ${err}`);
  }

   // Store all messages in local storage
  const allMessages = messageWrapper.querySelectorAll('.chat-message');
  allMessages.forEach((msg) => {
    const isBot = msg.classList.contains('bot-message');
    const message = msg.querySelector('.message-text').textContent.trim();
    messages.push({ isBot, message });
  });
  // Summarize previous messages and display
  const previousMessages = messages.filter((message) => !message.isBot).map((message) => message.message);
  const summarizedMessages = await summarizeMessages(previousMessages);
  setSummary(summarizedMessages);
  // Construct string of all messages
  let allMessageString = "";
  messages.forEach((message) => {
    allMessageString += `${message.isBot ? "Bot: " : "User: "}${message.message}\n`;
  });
  // Alert all messages
  window.alert(`All messages:\n${allMessageString}`);
  // Store all messages in local storage
  localStorage.setItem('messages', JSON.stringify(messages));


  
  
  // Summarize previous messages and display
  const previousMessages = messages.filter((message) => !message.isBot).map((message) => message.message);
  const summarizedMessages = await summarizeMessages(previousMessages);
  setSummary(summarizedMessages);

  
  // Write the message to an XML file
  let messageXml;
  try {
    messageXml = `<message isBot="false">${data.get('prompt')}</message>`;
    //window.alert(`writing message to file: ${messageXml}`);
    writeMessageToFile(false, messageXml);
  } catch (err) {
    console.error(err);
    window.alert(`Error in writing message to file 2: ${err.message}`);
  }
};



function writeMessageToFile(isBot, messageXml) {
  const fileName = isBot ? 'bot_messages.xml' : 'user_messages.xml';
  const file = new Blob([messageXml], {type: 'text/xml'});
  const a = document.createElement('a');
  const url = URL.createObjectURL(file);
  a.href = url;
  a.download = fileName;

  // Save the file to the "memory" array
  const memory = JSON.parse(localStorage.getItem('memory') || '[]');
  memory.push({ fileName, url });
  localStorage.setItem('memory', JSON.stringify(memory));

  a.click();
  
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);

  a.addEventListener('error', function() {
    console.error('Error downloading file');
    alert('Error downloading file');
  });
}







chatContainer.addEventListener('scroll', () => {
  try {
    const isAtBottom = chatContainer.scrollHeight - chatContainer.scrollTop === chatContainer.clientHeight;
    if (isAtBottom) {
      //alert('You have reached the end of the chat.');
    }
  } catch (error) {
    console.error('Error checking if at bottom of chat container:', error);
    //alert('Error checking if at bottom of chat container.');
  }
});

window.addEventListener('resize', () => {
  // check if user has scrolled up before resizing
  const isScrolledToBottom = chatContainer.scrollHeight - chatContainer.clientHeight <= chatContainer.scrollTop + 1;
  // calculate new scroll position after resizing
  const newScrollTop = (chatContainer.scrollHeight - chatContainer.clientHeight) * (chatContainer.scrollTop / (chatContainer.scrollHeight - chatContainer.clientHeight));
  // set chat container height to its current height
  chatContainer.style.height = `${chatContainer.clientHeight}px`;
  // scroll to the bottom of the chat container if user is already at the bottom
  if (isScrolledToBottom) {
    chatContainer.scrollTop = newScrollTop;
    //chatContainer.scrollTop = 0;
  }
  // if user has scrolled up, keep their scroll position after resizing
  else {
    chatContainer.scrollTop = chatContainer.scrollHeight - chatContainer.clientHeight - (1 - (newScrollTop / chatContainer.clientHeight)) * (chatContainer.scrollHeight - chatContainer.clientHeight);
  }
});

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    handleSubmit(e);
  }
});

