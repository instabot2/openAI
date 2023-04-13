import bot from './assets/bot.svg';
import user from './assets/user.svg';
import { useSelector } from 'react-redux';

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


//import { useSelector } from 'react-redux';

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  // Retrieve stored messages from local storage
  const oldMessages = JSON.parse(localStorage.getItem('messages')) || [];

  // Store the user's input and add it to the conversation history
  const userMessage = data.get('prompt').trim();
  const userMessageObj = { isBot: false, message: userMessage };
  const messages = [...oldMessages, userMessageObj];
  localStorage.setItem('messages', JSON.stringify(messages));
  
  // Retrieve the conversation history from the Redux store
  const conversationHistory = useSelector(state => state.conversationHistory);

  // Clear existing chat messages
  messageWrapper.innerHTML = '';

  // user's chatstripe
  const userMessageHtml = chatStripe(false, userMessage);
  messageWrapper.insertAdjacentHTML('beforeend', userMessageHtml);

  // to clear the textarea input
  form.reset();

  // bot's chatstripe
  const uniqueId = generateUniqueId();
  const botMessageHtml = chatStripe(true, '', uniqueId);
  messageWrapper.insertAdjacentHTML('beforeend', botMessageHtml);

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
        prompt: userMessage,
        conversationHistory: conversationHistory,
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

        // Store the new message in local storage
        const newMessage = { isBot: true, message: parsedData };
        const messages = [...oldMessages, newMessage];
        localStorage.setItem('messages', JSON.stringify(messages));

        // Write the messages to an XML file
        try {
          const messagesXml = messages
            .filter((message) => message.isBot)
            .map((message) => `<message isBot="true">${message.message}</message>`)
            .join('');
          const messageXml = `<messages>${messagesXml}</messages>`;
          //window.alert(`writing messages to file: ${messageXml}`);
          writeMessageToFile(true, messageXml);
        } catch (err) {
          console.error(err);
        }
      });

      // Update the conversation history in the Redux store
      dispatch(updateConversationHistory([...conversationHistory, parsedData]));
    } else {
      console.error(`Response status: ${response.status}`);
    }
  } catch (err) {
    console.error(err);
  }
};





function writeMessageToFile(isBot, messageXml) {
  if (!isBot) return; // Only save bot messages

  const fileName = 'bot_messages.xml';
  const file = new Blob([messageXml], { type: 'text/xml' });

  // Save the file to the "memory" array
  const memory = JSON.parse(localStorage.getItem('memory') || '[]');
  const existingFileIndex = memory.findIndex((file) => file.fileName === fileName);
  if (existingFileIndex !== -1) {
    // Overwrite existing file
    const existingFile = memory[existingFileIndex];
    URL.revokeObjectURL(existingFile.url);
    memory.splice(existingFileIndex, 1);
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;

  a.addEventListener('error', function () {
    console.error('Error downloading file');
    alert('Error downloading file');
  });

  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);

  memory.push({ fileName, url });
  localStorage.setItem('memory', JSON.stringify(memory));
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

