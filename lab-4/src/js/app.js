console.log('Kanban Board App: Załadowano.');

const generateId = () => {
    return 'card-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
};

const getRandomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 100%, 85%)`;
};

const LOCAL_STORAGE_KEY = 'kanban-board-data';

const saveBoardState = () => {
    const boardData = {};
    const columns = document.querySelectorAll('.column');

    columns.forEach((column) => {
        const columnId = column.id;
        const cards = [];
        const taskList = column.querySelector('.task-list');

        taskList.querySelectorAll('.kanban-card').forEach((card) => {
            cards.push({
                id: card.dataset.id,
                text: card.querySelector('.card-content').innerText,
                color: card.style.backgroundColor,
            });
        });

        boardData[columnId] = cards;
    });

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(boardData));
};

const updateTaskCounts = () => {
    const columns = document.querySelectorAll('.column');
    columns.forEach((column) => {
        const count = column.querySelectorAll('.kanban-card').length;
        const countSpan = column.querySelector('.task-count');
        if (countSpan) {
            countSpan.innerText = `(${count})`;
        }
    });
};

const createCardElement = (text = 'Nowe zadanie', id = null, color = null) => {
    const card = document.createElement('div');
    card.classList.add('kanban-card');

    const cardId = id || generateId();
    card.setAttribute('data-id', cardId);
    card.id = cardId;

    const finalColor = color || getRandomColor();
    card.style.backgroundColor = finalColor;

    const defaultText = 'Nowe zadanie';

    card.innerHTML = `
    <div class="card-content" contenteditable="true" spellcheck="false">${text}</div>
    
    <input type="color" class="card-color-picker" title="Zmień kolor karty" value="#ffffff">
    <div class="delete-btn" title="Usuń kartę">✕</div>
    
    <div class="card-actions">
      <button class="move-btn move-left-btn" title="Przesuń w lewo">←</button>
      <button class="move-btn move-right-btn" title="Przesuń w prawo">→</button>
    </div>
  `;

    const contentArea = card.querySelector('.card-content');

    contentArea.addEventListener('focus', () => {
        if (contentArea.innerText.trim() === defaultText)
            contentArea.innerText = '';
    });

    contentArea.addEventListener('blur', () => {
        if (contentArea.innerText.trim() === '')
            contentArea.innerText = defaultText;
        saveBoardState();
    });

    card.querySelector('.delete-btn').addEventListener('click', () => {
        if (confirm('Czy na pewno chcesz usunąć to zadanie?')) {
            card.remove();
            updateTaskCounts();
            saveBoardState();
        }
    });

    card.querySelector('.card-color-picker').addEventListener('input', (e) => {
        card.style.backgroundColor = e.target.value;
        saveBoardState();
    });

    return card;
};

const setupColumnActions = () => {
    document.querySelectorAll('.color-col-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const column = e.target.closest('.column');
            const cards = column.querySelectorAll('.kanban-card');
            cards.forEach(
                (card) => (card.style.backgroundColor = getRandomColor())
            );
            saveBoardState();
        });
    });

    document.querySelectorAll('.sort-col-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const column = e.target.closest('.column');
            const taskList = column.querySelector('.task-list');
            const cards = Array.from(taskList.querySelectorAll('.kanban-card'));

            cards.sort((a, b) => {
                const textA = a
                    .querySelector('.card-content')
                    .innerText.trim()
                    .toLowerCase();
                const textB = b
                    .querySelector('.card-content')
                    .innerText.trim()
                    .toLowerCase();
                return textA.localeCompare(textB);
            });

            cards.forEach((card) => taskList.appendChild(card));
            saveBoardState();
        });
    });

    document.querySelectorAll('.add-card-btn').forEach((button) => {
        button.addEventListener('click', (e) => {
            const column = e.target.closest('.column');
            const taskList = column.querySelector('.task-list');

            const newCard = createCardElement();
            taskList.appendChild(newCard);

            updateTaskCounts();
            saveBoardState();

            setTimeout(() => newCard.querySelector('.card-content').focus(), 0);
        });
    });
};

const setupDragAndDropNavigation = () => {
    const columns = document.querySelectorAll('.column');
    const flow = {
        todo: { next: 'inprogress', prev: null },
        inprogress: { next: 'done', prev: 'todo' },
        done: { next: null, prev: 'inprogress' },
    };

    columns.forEach((column) => {
        column.addEventListener('click', (event) => {
            if (event.target.classList.contains('move-btn')) {
                const card = event.target.closest('.kanban-card');
                const currentColumnId = column.id;
                const action = event.target.classList.contains('move-right-btn')
                    ? 'next'
                    : 'prev';
                const targetColumnId = flow[currentColumnId][action];

                if (targetColumnId) {
                    document
                        .getElementById(targetColumnId)
                        .querySelector('.task-list')
                        .appendChild(card);
                    updateTaskCounts();
                    saveBoardState();
                }
            }
        });
    });
};

const loadBoardState = () => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!savedData) return;

    const boardData = JSON.parse(savedData);

    for (const [columnId, cardsData] of Object.entries(boardData)) {
        const column = document.getElementById(columnId);
        if (column) {
            const taskList = column.querySelector('.task-list');
            taskList.innerHTML = '';

            cardsData.forEach((cardData) => {
                const cardElement = createCardElement(
                    cardData.text,
                    cardData.id,
                    cardData.color
                );
                taskList.appendChild(cardElement);
            });
        }
    }
};

loadBoardState();

updateTaskCounts();

setupColumnActions();
setupDragAndDropNavigation();
