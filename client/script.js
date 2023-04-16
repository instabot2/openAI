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


let conversationHistory = [];

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  // Retrieve stored messages from local storage
  const oldMessages = JSON.parse(localStorage.getItem('messages')) || [];
  window.alert(`The old messages are: ${JSON.stringify(oldMessages)}`);
  // Add user message to conversation history
  const userMessage = { isBot: false, message: data.get('prompt') };
  conversationHistory.push(userMessage);
  window.alert(`current conversationHistory: ${JSON.stringify(conversationHistory)}`);
 
  // Clear existing chat messages
  messageWrapper.innerHTML = '';
  
  // user's chatstripe
  const userChatStripe = chatStripe(false, data.get('prompt'));
  messageWrapper.insertAdjacentHTML('beforeend', userChatStripe);

  // to clear the textarea input
  form.reset();

  // bot's chatstripe
  const uniqueId = generateUniqueId();
  const botChatStripe = chatStripe(true, '', uniqueId);
  messageWrapper.insertAdjacentHTML('beforeend', botChatStripe);

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
        conversationHistory: conversationHistory,
        prompt: conversationHistory.map((msg) => msg.message).join('\n') + '\n' + data.get('prompt'),
      }),
    });

    clearInterval(loadInterval);
    messageDiv.innerHTML = '';

    if (response.ok) {
      const responseData = await response.json();
      const parsedData = responseData.bot.trim(); // trims any trailing spaces/'\n'

      // Add bot message to conversation history
      const botMessage = { isBot: true, message: parsedData };
      conversationHistory.push(botMessage);
      window.alert(`Writing botMessage conversationHistory: ${JSON.stringify(conversationHistory)}`);
      
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
          console.log(`Writing messages to file: ${messageXml}`);
          window.alert(`Writing messages to file: ${JSON.stringify(messageXml)}`);
          //write Message To File
          //writeMessageToFile(true, messageXml);
          
        } catch (err) {
          console.error(err);
        }
      });


      console.log('responseData:', responseData);

      // Combine conversation history with new messages received from the server
      const newMessages = responseData?.conversationHistory || [];
      conversationHistory.push(...newMessages);
      // Update conversation history in local storage
      localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
      // Update the UI with the new messages
      updateConversationHistory(conversationHistory);
      console.log('Conversation history has been updated!', conversationHistory);
      window.alert(`Conversation history has been updated with new data: ${JSON.stringify(newMessages)}`);

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
  const file = new Blob([messageXml], {type: 'text/xml'});
  const a = document.createElement('a');
  const url = URL.createObjectURL(file);
  a.href = url;
  a.download = fileName;

  a.addEventListener('error', function() {
    console.error('Error downloading file');
    alert('Error downloading file');
  });

  a.click();
  
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);

  // Save the file to the "memory" array
  const memory = JSON.parse(localStorage.getItem('memory') || '[]');
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

