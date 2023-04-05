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

function scrollIntoView(element, behavior = 'smooth', block = 'start') {
  element.scrollIntoView({
    behavior,
    block,
  });
}

function typeText(element, text, callback) {
  let index = 0;

  // add typing animation
  let message = document.createElement('div');
  message.classList.add('bot-message');
  message.style.opacity = 0;
  message.style.transform = 'translateY(100%)'; // set initial position below the chat box

  // temporarily set flex-direction to 'column' to add message at the top
  element.style.flexDirection = 'column';
  element.insertBefore(message, element.firstChild);

  const lineHeight = parseInt(window.getComputedStyle(message).lineHeight);
  const maxHeight = parseInt(window.getComputedStyle(element).maxHeight);

  let interval = setInterval(() => {
    if (index < text.length) {
      message.innerHTML += text.charAt(index);
      index++;
      element.scrollTop = Math.max(0, message.scrollHeight - maxHeight + lineHeight);
      message.style.transform = `translateY(-${message.offsetHeight}px)`; // animate message up
      message.style.opacity = 1; // make message visible
    } else {
      clearInterval(interval);
      message.style.opacity = 1; // make message visible in case text was too short
      if (callback) {
        callback();
      }
      // reset flex-direction to 'column-reverse' after message has been added
      element.style.flexDirection = 'column-reverse';
      // add message to chat window
      let newMessage = document.createElement('div');
      newMessage.classList.add('bot-message');
      // remove typing dots animation before copying message innerHTML
      let dots = message.querySelector('.typing-dots');
      if (dots) {
        message.removeChild(dots);
      }
      newMessage.innerHTML = message.innerHTML;
      element.insertBefore(newMessage, element.firstChild);
      // remove temporary message
      element.removeChild(message);
      // scroll to the bottom of the chat window
      element.scrollTop = element.scrollHeight - element.clientHeight;
    }
  }, 50); // increase interval to slow down typing animation

  // add typing dots animation
  let dotsInterval = setInterval(() => {
    let dots = message.querySelector('.typing-dots');
    if (!dots) {
      dots = document.createElement('div');
      dots.classList.add('typing-dots');
      message.appendChild(dots);
    }
    if (dots.innerHTML.length > 2) {
      dots.innerHTML = '';
    } else {
      dots.innerHTML += '.';
    }
  }, 400);
}

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  // Retrieve stored messages from local storage
  const messages = JSON.parse(localStorage.getItem('messages')) || [];

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
      const data = await response.json();
      const parsedData = data.bot.trim(); // trims any trailing spaces/'\n'

      // scroll up to the new message and display it on top of the browser
      const messageDivHeight = messageDiv.offsetHeight;
      const previousMessageDivsHeight = Array.from(messageWrapper.children).reduce((acc, cur) => acc + cur.offsetHeight, 0);
      chatContainer.scrollTop = previousMessageDivsHeight + messageDivHeight - chatContainer.offsetHeight;

      // call typeText after scrolling
      typeText(messageDiv, parsedData, () => {
        // scroll to the latest message
        chatContainer.scrollTop = 0;

        // Store the message in local storage
        messages.push({ isBot: true, message: parsedData });
        localStorage.setItem('messages', JSON.stringify(messages));
      });
    } else {
      const err = await response.text();
      throw new Error(`Error ${response.status}: ${err}`);
    }
  } catch (err) {
    messageDiv.innerHTML = err.message;
    console.error(err);
  }

  // add event listener to chatContainer to force scroll old messages up when at bottom
  chatContainer.addEventListener('scroll', () => {
    const isAtBottom = chatContainer.scrollHeight - chatContainer.scrollTop === chatContainer.clientHeight;
    if (isAtBottom) {
      chatContainer.scrollTop = 0;
    }
  });

  // Store the user's message in local storage
  messages.push({ isBot: false, message: data.get('prompt') });
  localStorage.setItem('messages', JSON.stringify(messages));
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
