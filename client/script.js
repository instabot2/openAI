import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

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

function typeText(element, text) {
  let index = 0;
  let interval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 20);
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

// Function to create the chat stripe
function chatStripe(isAi, value, uniqueId) {
  return `
    <div class="wrapper ${isAi && 'ai'} auto-scroll">
      <div class="chat">
        <div class="profile">
          <img src=${isAi ? bot : user} alt="${isAi ? 'bot' : 'user'}"/>
        </div>
        <div class="message" id=${uniqueId}>${value}</div>
      </div>
    </div>
  `;
}

// Function to scroll the chat container to the bottom
function scrollToBottom() {
  // Only scroll to the bottom if the chat container has the 'auto-scroll' class
  if (chatContainer.classList.contains('auto-scroll')) {
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Check if the user has manually scrolled up the chat container
    const scrollDiff = chatContainer.scrollTop + chatContainer.offsetHeight - chatContainer.scrollHeight;
    if (scrollDiff < 0) {
      // The user has scrolled up, so remove the 'auto-scroll' class
      chatContainer.classList.remove('auto-scroll');
    }
  }
}



function addNewMessage(message) {
  // Create a new chat stripe element
  const newChatStripe = document.createElement('div');
  newChatStripe.innerHTML = message;
  // Check if the message is from the bot
  const isBotMessage = message.includes('bot');
  // Add the new chat stripe element to the chat container
  chatContainer.appendChild(newChatStripe);
  // Scroll the chat container to the bottom after a small delay
  setTimeout(() => {
    if (isBotMessage) {
      const messageElement = newChatStripe.querySelector('.message');
      if (messageElement) {
        messageElement.scrollIntoView();
      }
    }
    chatContainer.classList.add('auto-scroll'); // add auto-scroll class
    scrollToBottom();
  }, 100);
}



  
 
const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);
  // user's chatstripe
  chatContainer.innerHTML += chatStripe(false, data.get('prompt'));
  // to clear the textarea input
  form.reset();
  // bot's chatstripe
  const uniqueId = generateUniqueId();
  chatContainer.innerHTML += chatStripe(true, ' ', uniqueId);
  // specific message div
  const messageDiv = document.getElementById(uniqueId);
  // messageDiv.innerHTML = '...'
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
      const data = await response.json();
      const parsedData = data.bot.trim(); // trims any trailing spaces/'\n'
      typeText(messageDiv, parsedData);
      // scroll to the latest message
      scrollToBottom();

    } else {
      const err = await response.text();
      messageDiv.innerHTML = `Error: ${err}`;
    }
  } catch (err) {
    messageDiv.innerHTML = `Something went wrong: ${err}`;
    console.error(err);
  }

  // focus scroll to the bottom again
  scrollToBottom();
}; 


form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    handleSubmit(e);
  }
});
