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
  const beforeHeight = element.scrollHeight;
  const interval = setInterval(() => {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      index++;
      element.scrollTop = element.scrollHeight;
    } else {
      clearInterval(interval);
      if (callback) {
        callback();
      }
      const afterHeight = element.scrollHeight;
      if (afterHeight - beforeHeight > 0) {
        scrollToBottom();
      } else {
        scrollToBottom(false);
      }
    }
  }, 20);
}

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  const messages = JSON.parse(localStorage.getItem('messages')) || [];

  const userMessage = chatStripe(false, data.get('prompt'));
  messageWrapper.insertAdjacentHTML('beforeend', userMessage);

  form.reset();

  const uniqueId = generateUniqueId();
  const botMessage = chatStripe(true, '', uniqueId);
  messageWrapper.insertAdjacentHTML('beforeend', botMessage);

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
    messageDiv.textContent = '';

    if (response.ok) {
      const { bot } = await response.json();
      const parsedData = bot.trim();

      setTimeout(() => {
        const botTyping = chatStripe(true, '', uniqueId + '-typing');
        messageWrapper.insertAdjacentHTML('beforeend', botTyping);
        const botTypingDiv = document.getElementById(uniqueId + '-typing');
        botTypingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        scrollToBottom();
      }, 500);

      setTimeout(() => {
        typeText(messageDiv, parsedData, () => {
          const botTypingDiv = document.getElementById(uniqueId + '-typing');
          botTypingDiv?.remove();

          messages.push({ isBot: true, message: parsedData });
          localStorage.setItem('messages', JSON.stringify(messages));

          input.disabled = false;

          if (messageWrapper.scrollHeight - messageWrapper.scrollTop === messageWrapper.clientHeight) {
            scrollToBottom();
          }
        });
      }, 2000);

    } else {
      const err = await response.text();
      throw new Error(`Error ${response.status}: ${err}`);
    }
  } catch (err) {
    messageDiv.textContent = err;
  }
};

function scrollToBottom(smooth = true, force = false) {
  const chatContainer = document.querySelector('#chat_container');
  const messageWrapper = document.querySelector('#message_wrapper');
  if (force || messageWrapper.scrollHeight - messageWrapper.scrollTop === messageWrapper.clientHeight) {
    if (smooth) {
      messageWrapper.scroll({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }
}




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
