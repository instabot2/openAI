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
  
  const input = form.elements.prompt.value;
  
  // Create a new div element for the user's message
  const userMessageDiv = document.createElement('div');
  userMessageDiv.classList.add('chat-stripe', 'user');
  userMessageDiv.textContent = input;
  chatContainer.appendChild(userMessageDiv);
  
  // Clear the input field
  form.elements.prompt.value = '';
  
  // Create a new div element for the bot's message
  const botMessageDiv = document.createElement('div');
  botMessageDiv.classList.add('chat-stripe', 'bot');
  chatContainer.appendChild(botMessageDiv);
  
  // Display a loading message while waiting for the response from the server
  botMessageDiv.textContent = 'Thinking...';
  
  try {
    // Send the user's input to the server for processing
    const response = await fetch('https://chatgpt-ai-lujs.onrender.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: input,
      }),
    });

    // Update the bot's message with the response from the server
    if (response.ok) {
      const data = await response.json();
      const botResponse = data.bot.trim(); // trim any trailing spaces or newlines
      botMessageDiv.textContent = botResponse;
    } else {
      const error = await response.text();
      botMessageDiv.textContent = `Error: ${error}`;
    }
  } catch (error) {
    console.error(error);
    botMessageDiv.textContent = 'Something went wrong. Please try again.';
  }

  // Scroll to the bottom of the chat container
  chatContainer.scrollTop = chatContainer.scrollHeight;
};



form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    handleSubmit(e);
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
  }
  // if user has scrolled up, keep their scroll position after resizing
  else {
    chatContainer.scrollTop = chatContainer.scrollHeight - chatContainer.clientHeight - (1 - (newScrollTop / chatContainer.clientHeight)) * (chatContainer.scrollHeight - chatContainer.clientHeight);
  }
});
