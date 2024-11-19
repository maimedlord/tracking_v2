const URL_BASE = 'http://127.0.0.1:5000/api'
let NOTES_OBJ = false;

// HTML variables
let id_button_create = document.getElementById('button_create');
let id_button_delete_no = document.getElementById('button_delete_no');
let id_button_delete_yes = document.getElementById('button_delete_yes');
let id_note_create_container = document.getElementById('note_create_container');
let id_note_confirm_delete_container = document.getElementById('note_confirm_delete_container');
let id_note_edit_container = document.getElementById('note_edit_container');
let id_notes_container = document.getElementById('notes_container');

// other variables
//

async function api_delete_note(note_id) {
    try {
        console.log(note_id);
        let url = URL_BASE + '/note_delete/' + note_id;
        // Make an asynchronous GET request to the API
        const response = await fetch(url, {method: 'GET'});
        // Check if the response was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Parse the JSON data from the response
        const data = await response.json();
        console.log(response);
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: api_delete_note(): ", error);
    }
}

async function api_edit_note() {}

async function api_get_notes() {
    try {
        let url = URL_BASE + '/notes_get_all';
        // Make an asynchronous GET request to the API
        const response = await fetch(url, {method: 'GET'});
        // Check if the response was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Parse the JSON data from the response
        const data = await response.json();
        NOTES_OBJ = data;
        if (parseInt(NOTES_OBJ['status_code']) != 200) {
            console.log('api_get_notes():\n', NOTES_OBJ);
            return;
        }
        id_notes_container.innerHTML = '';
        // draw the notes
        for (let i = 0; i < NOTES_OBJ['data'].length; i++) {
            // console.log(NOTES_OBJ.data[i]);
            let note_container = document.createElement('div');
            note_container.className = 'note_container';
            note_container.id = NOTES_OBJ['data'][i]['_id'];
            note_container.innerHTML = '<div class="note_menu"><div class="button button_delete" onclick="confirm_delete_popup(\'' + NOTES_OBJ['data'][i]['_id'] + '\')">DELETE</div><div class="button button_edit" onclick="edit_note_popup(\'' + NOTES_OBJ['data'][i]['_id'] + '\')">EDIT</div></div>';
            note_container.innerHTML += NOTES_OBJ['data'][i]['_id'] + "<br>" + NOTES_OBJ['data'][i]['title'] +
                "<br>" + NOTES_OBJ['data'][i]['dateCreated'] + "<br>" + NOTES_OBJ['data'][i]['location'] +
                "<br>" + NOTES_OBJ['data'][i]['text'];
            id_notes_container.append(note_container);
        }
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: api_get_notes(): ", error);
    }
}

function close_popups() {
    // Select all divs with the class 'popup'
    const divsToHide = document.querySelectorAll(".popup");
    // Loop through each div and set display to 'none'
    divsToHide.forEach(div => {
        div.style.display = "none";
    });
}

function confirm_delete_popup(note_id) {
    try {
        close_popups();
        id_note_confirm_delete_container.style.display = 'flex';
        id_button_delete_yes.onclick=function () {
            api_delete_note(note_id)
                .then(() => {
                    console.log('button delete yes was clicked');
                    id_note_confirm_delete_container.style.display = 'none';
                    api_get_notes()
                        .then(() => {
                            console.log('api_get_notes activated');
                        })
                })
        }
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: confirm_delete_popup(): ", error);
    }
}

function edit_note_popup(note_id) {
    try {
        close_popups();
        id_note_edit_container.style.display = 'flex';
        console.log('edit_note_popup(' + note_id + ')')
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: edit_note_popup(): ", error);
    }
}

// onclicks:
id_button_create.onclick=function () {
    try {
        close_popups();
        id_note_create_container.style.display = 'flex';
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: id_button_delete_no.onclick: ", error);
    }
}

id_button_delete_no.onclick=function () {
    try {
        close_popups();
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: id_button_delete_no.onclick: ", error);
    }
}

// ???
window.onload=function () {
    api_get_notes()
    .then(() => {})
    .catch(error => console.error("Error in api_get_notes:", error));
}


