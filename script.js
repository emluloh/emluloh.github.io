
document.addEventListener('DOMContentLoaded', async function() {
    let lives = 4; // Initialize lives
    let correctPokemonCounter = 0; // Initialize number of Pokemon user has gotten right
    const pokemonDB = [];
    const types = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
        'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
    ];
    const additionalConditions = ['kanto', 'johto', 'hoenn', 'sinnoh', 'legendary'];
    let columnConditions = [];
    let rowConditions = [];
    let currentFilterFunction = null;

    async function fetchAllPokemonData(limit = 493) {
        const url = `https://pokeapi.co/api/v2/pokemon?limit=${limit}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            const pokemonDetailsPromises = data.results.map(async (pokemon) => {
                const detailResponse = await fetch(pokemon.url);
                const detail = await detailResponse.json();

                // Fetch species data for legendary status of each Pokemon
                const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${detail.id}`); // detail.species.url should be the correct URL for species
                const speciesData = await speciesResponse.json();
                //const evolutionChainUrl = speciesData.evolution_chain.url;

                // Fetch evolution data of each Pokemon
                const evolutionChainResponse = await fetch(speciesData.evolution_chain.url);
                const evolutionChainData = await evolutionChainResponse.json();

                const { id, name, types, sprites } = detail;
                let gen = '';
                if (id >= 1 && id <= 151) {
                    gen = 'kanto';
                } else if (id >= 152 && id <= 251) {
                    gen = 'johto';
                } else if (id >= 252 && id <= 386) {
                    gen = 'hoenn';
                } else if (id >= 387 && id <= 493) {
                    gen = 'sinnoh';
                }

                let isLegendary = '';
                if (speciesData.is_legendary || speciesData.is_mythical) {
                    isLegendary = 'legendary';
                }

                return {
                    id,
                    name,
                    types: types.map(t => t.type.name),
                    sprite: sprites.front_default,
                    gen,
                    isLegendary,
                };
            });

            const details = await Promise.all(pokemonDetailsPromises);
            details.forEach(detail => pokemonDB.push(detail));
            console.log("Successfully fetched Pokemon data");
        } catch (error) {
            console.error("Failed to fetch Pokemon data:", error);
        }
    }

    // function setupBoardReloading() {
    //     function reloadBoard() {
    //         console.log("Board reloaded at", new Date().toLocaleTimeString());
    //         resetBoardUntilSolvable();
    //         saveGameState();
    //         createBoard();
    //     }

    //     async function saveGameState() {
    //         const gameState = {
    //             lives: lives,
    //             correctPokemonCounter: correctPokemonCounter,
    //             pokemonDB: JSON.stringify(pokemonDB),
    //             columnConditions: JSON.stringify(columnConditions),
    //             rowConditions: JSON.stringify(rowConditions)
    //         };

    //         try {
    //             const response = await fetch('/api/saveState', {
    //                 method: 'POST',
    //                 headers: {
    //                     'Content-Type': 'application/json'
    //                 },
    //                 body: JSON.stringify(gameState)
    //             });

    //             if (response.ok) {
    //                 console.log('Game state saved successfully.');
    //             } else {
    //                 console.error('Failed to save game state.');
    //             }
    //         } catch (error) {
    //             console.error('Error saving game state:', error);
    //         }
    //     }


    //     function calculateDelay() {
    //         const now = new Date();
    //         const minutes = now.getMinutes();
    //         const seconds = now.getSeconds();
    //         const milliseconds = now.getMilliseconds();

    //         const minutesUntilNext5MinuteMark = 1 - (minutes % 1);
    //         const secondsUntilNext5MinuteMark = (minutesUntilNext5MinuteMark * 60) - seconds;
    //         const millisecondsUntilNext5MinuteMark = (secondsUntilNext5MinuteMark * 1000) - milliseconds;

    //         return millisecondsUntilNext5MinuteMark;
    //     }

    //     const delay = calculateDelay();
    //     setTimeout(() => {
    //         reloadBoard();
    //         setInterval(reloadBoard, 1 * 60 * 1000);
    //     }, delay);
    // }

    console.log('DOMContentLoaded fired');
    await fetchAllPokemonData();
    // setupBoardReloading();
    console.log('Fetched Pokemon Data:', pokemonDB);

    function assignConditions() {
        columnConditions = [];
        rowConditions = [];
        const allConditions = [...types, ...types, ...additionalConditions];

        // Unique condition selection for columns
        while (columnConditions.length < 3) {
            const columnCond = allConditions[Math.floor(Math.random() * allConditions.length)];
            if (!columnConditions.includes(columnCond)) {
                columnConditions.push(columnCond);
                document.getElementById(`cond${String.fromCharCode(65 + columnConditions.length - 1)}`).src = `images/${columnCond}.png`;
                document.getElementById(`cond${String.fromCharCode(65 + columnConditions.length - 1)}`).alt = `${columnCond} Type`;
            }
        }

        // Unique condition selection for rows, ensuring no overlap with columnConditions
        while (rowConditions.length < 3) {
            const rowCond = allConditions[Math.floor(Math.random() * allConditions.length)];
            if (!rowConditions.includes(rowCond) && !columnConditions.includes(rowCond)) {
                rowConditions.push(rowCond);
                document.getElementById(`rowCond${String.fromCharCode(65 + rowConditions.length - 1)}`).src = `images/${rowCond}.png`;
                document.getElementById(`rowCond${String.fromCharCode(65 + rowConditions.length - 1)}`).alt = `${rowCond} Type`;
            }
        }
    }

    function checkSolvability() {
        for (let row = 0; row < 3; row++) {
            for (let column = 0; column < 3; column++) {
                const rowCond = rowConditions[row];
                const colCond = columnConditions[column];
                const matchingPokemon = pokemonDB.filter(pokemon => checkCond(pokemon, rowCond) && checkCond(pokemon, colCond));

                if (matchingPokemon.length < 2) {
                    console.log("At least one cell in the board does not have at least 2 Pokemon. Returning to resetBoardUntilSolvable.")
                    return false;
                }

                // Uncomment this if only one matching Pokemon is desired
                /*const pokemonFound = pokemonDB.some(pokemon => checkCond(pokemon, rowCond) && checkCond(pokemon, colCond));

                if (!pokemonFound) {
                    console.log("At least one cell in the board is not solvable. Returning to resetBoardUntilSolvable.")
                    return false; // No Pokemon fits the criteria for this cell
                }*/
            }
        }
        console.log("checkSolvability confirms board is solvable with at least two Pokemon per cell. Returning to resetBoardUntilSolvable.")
        return true;
        // Uncomment this if only one matching Pokemon is desired
        /*console.log("checkSolvability confirms board is solvable. Returning to resetBoardUntilSolvable.")
        return true; // All cells have at least one matching Pokemon*/
    }

    function resetBoardUntilSolvable() {
        let counter = 0;
        do {
            counter++;
            console.log("Unsolvable board: ", counter);
            assignConditions(); // Assign new types to rows and columns
        } while (!checkSolvability());
        console.log("Found solvable board. Returning to main program.");
    }

    function checkCond(pokemon, cond) {
        // Check if the condition is a type condition by checking if it's included in the 'types' array
        //console.log("Pokemon in use: ", pokemon);
        if (types.includes(cond)) {
            // If it's a type condition, check if the pokemon's types include this condition
            return pokemon.types && pokemon.types.includes(cond);
        } else if (pokemon.gen.includes(cond)) {
            return pokemon.gen === cond;
        } else if (pokemon.isLegendary === cond) {
            return pokemon.isLegendary === cond;
        } else {
            // For additional conditions (non-type conditions), directly compare the condition with pokemon's properties
            // Since additional conditions like 'gen', 'legend', 'firstEvol', etc., are hardcoded in pokemonDB
            // Directly accessing pokemon[cond] checks if the property exists and matches the condition
            return pokemon[cond] === true;
        }
    }

    function createBoard() {
        const board = document.getElementById('sudoku-board');
        board.innerHTML = ''; // Clear the board first
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            cell.addEventListener('click', () => selectPokemon(i));
            board.appendChild(cell);
        }
    }

    // Function to dynamically create and append a Pokemon entry to the modal
    function appendPokemonEntry(pokemon, index, columnCond, rowCond, container) {
        const pokemonEntry = document.createElement('div');
        pokemonEntry.className = 'pokemon-entry';

        const img = document.createElement('img');
        img.src = pokemon.sprite;
        img.alt = pokemon.name;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = pokemon.name;

        const addButton = document.createElement('button');
        addButton.textContent = 'Add';
        addButton.onclick = () => { // Using arrow function for cleaner syntax
            const cell = document.querySelectorAll('.cell')[index];
            if (checkCond(pokemon, columnCond) && checkCond(pokemon, rowCond)) {
                const cellImage = document.createElement('img');
                cellImage.src = pokemon.sprite;
                cellImage.alt = pokemon.name;

                // Clear existing content in the cell and append the new img element
                const cell = document.querySelectorAll('.cell')[index];
                cell.innerHTML = ''; // Clear any existing content (e.g., text or another image)
                cell.appendChild(cellImage);

                document.getElementById('pokemon-selector').style.display = 'none';
                correctPokemonCounter++;
                if (correctPokemonCounter >= 9) {
                    createConfetti();
                }
            } else {
                cell.classList.add('glow-red');
                setTimeout(() => cell.classList.remove('glow-red'), 1000);

                const livesCounter = document.getElementById('lives-counter');
                livesCounter.classList.add('pulse');
                setTimeout(() => livesCounter.classList.remove('pulse'), 1000);

                console.log("Player guessed wrong");
                lives--;
                console.log("Subtracted one life");
                updateLivesDisplay(lives);
                console.log("New lives should be displayed");
                document.getElementById('pokemon-selector').style.display = 'none';

                if (lives <= 0) {
                    alert('Game Over!');
                }
            }
        };

        pokemonEntry.appendChild(img);
        pokemonEntry.appendChild(nameSpan);
        pokemonEntry.appendChild(addButton);
        container.appendChild(pokemonEntry);
    } //end of appendPokemonEntry function

    function selectPokemon(index) {
        const columnCond = columnConditions[index % 3];
        const rowCond = rowConditions[Math.floor(index / 3)];
        const modal = document.getElementById('pokemon-selector');
        const searchInput = document.getElementById('pokemon-search');
        const optionsContainer = document.getElementById('pokemon-options');

        optionsContainer.innerHTML = ''; // Clear the options
        searchInput.value = '';
        searchInput.focus();

        if (currentFilterFunction) {
            searchInput.removeEventListener('input', currentFilterFunction); // Prevent duplicate event listeners
        }

        currentFilterFunction = function() {
            const filter = searchInput.value.toLowerCase();
            optionsContainer.innerHTML = ''; // Clear current options

            if (filter.length >= 2) {
                const filteredPokemon = pokemonDB.filter(pokemon => pokemon.name.toLowerCase().includes(filter));
                filteredPokemon.forEach(pokemon => appendPokemonEntry(pokemon, index, columnCond, rowCond, optionsContainer));
            }
        };

        searchInput.addEventListener('input', currentFilterFunction);
        currentFilterFunction();

        modal.style.display = 'block';
        modal.querySelector('.close').addEventListener('click', function() {
            modal.style.display = 'none';
        });
    } //end of selectPokemon function


    function updateLivesDisplay(lives) {
        console.log("Starting function 'updateLivesDisplay'");
        document.getElementById('lives-counter').textContent = `Lives: ${lives}`;
        console.log("Completing function 'updateLivesDisplay'");
    }


    resetBoardUntilSolvable();
    createBoard();
});



function createConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);

    for (let i = 0; i < 100; i++) { // Create 100 pieces of confetti
        const confettiPiece = document.createElement('div');
        confettiPiece.className = 'confetti-piece';
        confettiContainer.appendChild(confettiPiece);

        // Randomize the properties for each confetti piece
        confettiPiece.style.top = `${-2 - Math.random() * 20}vh`; // Random start above the screen
        confettiPiece.style.left = `${Math.random() * 100}%`;
        confettiPiece.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        confettiPiece.style.animationDuration = `${Math.random() * 3 + 2}s`; // Between 2 and 5 seconds
        confettiPiece.style.animationDelay = `${Math.random() * 4}s`; // Start at random times

        // Assign rotation animation based on whether i is odd or even
        confettiPiece.style.animationName = i % 2 === 0 ? 'confetti-right' : 'confetti-left';
    }
}





