// HTML variables
let id_button_create = document.getElementById('button_create');
let id_button_delete_no = document.getElementById('button_delete_no');
let id_button_delete_yes = document.getElementById('button_delete_yes');
let id_button_note_create_submit = document.getElementById('button_note_create_submit');
let id_button_note_update_submit = document.getElementById('button_note_update_submit');
let id_note_create_container = document.getElementById('note_create_container');
let id_note_create_error_message = document.getElementById('note_create_error_message');
let id_note_confirm_delete_container = document.getElementById('note_confirm_delete_container');
let id_note_edit_container = document.getElementById('note_edit_container');
let id_note_update_error_message = document.getElementById('note_update_error_message');
let id_notes_container = document.getElementById('notes_container');
let id_select_sort_by = document.getElementById('select_sort_by');

// other variables
let last_sort_by = '';
let NOTES_OBJ = false;
let this_page = 'notes';
const URL_BASE = 'http://127.0.0.1:5000/api';
let VIEWS_OBJ = false;
//

async function delete_note(note_id) {
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
        get_notes()
            .then(() => {})
            .catch(error => console.error("Error in get_notes:", error));
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: delete_note(): ", error);
    }
}

async function get_notes() {
    try {
        let url = URL_BASE + '/notes_get_all';
        // Make an asynchronous GET request to the API
        const response = await fetch(url, {method: 'GET'});
        // Check if the response was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);// exit
        }
        // Parse the JSON data from the response
        const data = await response.json();
        NOTES_OBJ = data;
        if (parseInt(NOTES_OBJ['statusCode']) === 204) {// exit
            id_notes_container.innerHTML = 'There are no notes.';
            console.log('get_notes() non-200 Response:\n', NOTES_OBJ);
            return;
        }
        id_notes_container.innerHTML = '';
        // draw the notes
        for (let i = 0; i < NOTES_OBJ['data'].length; i++) {
            // console.log(NOTES_OBJ.data[i]);
            let note_container = document.createElement('div');
            note_container.className = 'note_container';
            note_container.id = NOTES_OBJ['data'][i]['_id'];
            note_container.style.borderColor = '#' + NOTES_OBJ['data'][i]['color'];
            note_container.dataset.datecreated = NOTES_OBJ['data'][i]['dateCreated'];
            note_container.dataset.intensity = NOTES_OBJ['data'][i]['intensity'];
            note_container.dataset.textlength = NOTES_OBJ['data'][i]['text'].length;
            note_container.dataset.title = NOTES_OBJ['data'][i]['title'];
            note_container.innerHTML = '<div class="note_menu"><div class="button button_delete" onclick="confirm_delete_popup(\'' + NOTES_OBJ['data'][i]['_id'] + '\')">DELETE</div><div class="button button_edit" onclick="edit_note_popup(\'' + NOTES_OBJ['data'][i]['_id'] + '\')">EDIT</div></div>';
            note_container.innerHTML += NOTES_OBJ['data'][i]['_id'] + "<br>" + NOTES_OBJ['data'][i]['title'] +
                "<br>" + NOTES_OBJ['data'][i]['dateCreated'] + "<br>" + NOTES_OBJ['data'][i]['location'] +
                "<br>" + NOTES_OBJ['data'][i]['intensity'] + "<br>" + NOTES_OBJ['data'][i]['tags'] +
                "<br>" + NOTES_OBJ['data'][i]['text'];
            id_notes_container.append(note_container);
        }
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: get_notes(): ", error);
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
            delete_note(note_id)
                .then(() => {
                    console.log('button delete yes was clicked');
                    id_note_confirm_delete_container.style.display = 'none';
                    get_notes()
                        .then(() => {
                            console.log('get_notes activated');
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
        // let note_obj =
        console.log(NOTES_OBJ);
        let local_note = get_local_note(note_id);
        console.log(local_note);
        // handle failure
        if (!local_note) {
            throw new Error('local_note returned null...');// exit
        }
        document.getElementById('update_note_id').value = note_id;
        document.getElementById('update_note_color').value = '#' + local_note['color'];
        document.getElementById('update_note_title').value = local_note['title'];
        document.getElementById('update_note_location').value = local_note['location'];
        document.getElementById('update_note_intensity').value = local_note['intensity'];
        document.getElementById('update_note_tags').value = local_note['tags'];
        document.getElementById('update_note_text').value = local_note['text'];
        id_note_edit_container.style.display = 'flex';
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: edit_note_popup(): ", error);
    }
}

// RETURN null if no local note found || note object if found
function get_local_note(note_id) {
    try {
        if (NOTES_OBJ['data'].length < 1) {
            return null;
        }
        for (let i = 0; i < NOTES_OBJ['data'].length; i++) {
            if (NOTES_OBJ['data'][i]['_id'] == note_id) {
                return NOTES_OBJ['data'][i];
            }
        }
        return null;
    } catch (error) {
        // Handle errors
        console.error("There was an error with get_local_note(): ", error);
    }
}

async function get_view_configs(target) {
    try {
        let url = URL_BASE + '/view_get/' + target
        // Make an asynchronous GET request to the API
        const response = await fetch(url, {method: 'GET'});
        // Check if the response was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Parse the JSON data from the response
        const data = await response.json();
        VIEWS_OBJ = data.data;
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: get_notes(): ", error);
    }
}

function sort_notes() {
    // Skip if no sort value or no children to sort
    if (!id_select_sort_by.value || !id_notes_container.childNodes.length) {
        return;
    }
    let sorted_arr = Array.from(id_notes_container.childNodes);
    const sort_values = id_select_sort_by.value.split(',');
    const sortMultiplier = sort_values[1] === '0' ? 1 : -1;
    sorted_arr = sorted_arr.sort((a, b) => {
        return a.dataset[sort_values[0]].localeCompare(b.dataset[sort_values[0]]) * sortMultiplier;
    });
    id_notes_container.innerHTML = '';
    for (let element of sorted_arr) {
        id_notes_container.append(element);
    }
}

async function view_update(view_obj) {
    try {
        let url = URL_BASE + '/view_update/' + JSON.stringify(view_obj);
        // make asynchronous POST request to the API
        const response = await fetch(url, {method: 'GET'});
        // check if response was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Parse the JSON data from the response
        const data = await response.json();
        if (data.status !== 200) {
            console.log('view_update: ' + data.statusCode);
        }
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: view_update: ", error);
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

id_button_note_create_submit.onclick=async function () {
    try {
        let id_form_color = document.getElementById('create_note_color');
        let id_form_title = document.getElementById('create_note_title');
        let id_form_location = document.getElementById('create_note_location');
        let id_form_intensity = document.getElementById('create_note_intensity');
        let id_form_tags = document.getElementById('create_note_tags');
        let id_form_text = document.getElementById('create_note_text');
        // INPUT VALIDATION
        // note title cannot be blank
        if (id_form_title.value.toString() === "") {
            id_note_create_error_message.style.display = 'flex';
            return;
        }
        let note_obj = {
            'color': id_form_color.value.substring(1,id_form_color.value.length),
            'children': [],
            'location': id_form_location.value,
            'intensity': id_form_intensity.value,
            'parents': [],
            'tags': id_form_tags.value,
            'text': id_form_text.value,
            'title': id_form_title.value,
        }
        let url = URL_BASE + '/note_create/' + JSON.stringify(note_obj);
        // make asynchronous POST request to the API
        const response = await fetch(url, {method: 'GET'});
        // check if response was successful
        console.log(response);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Parse the JSON data from the response
        const data = await response.json();
        if (data.statusCode != 200) {
            id_note_update_error_message.textContent = 'Error updating note: non-200 response received...';
            id_note_update_error_message.style.display = 'flex';
            return;
        }
        close_popups()
        // reset form values
        id_form_color.value = '';
        id_form_title.value = '';
        id_form_location.value = '';
        id_form_intensity.value = '';
        id_form_tags.value = '';
        id_form_text.value = '';
        get_notes()
            .then(() => {})
            .catch(error => console.error("Error in get_notes:", error));
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: id_button_note_create_submit.onclick: ", error);
    }
}

id_button_note_update_submit.onclick=async function () {
    try {
        let id_form_id = document.getElementById('update_note_id');
        let id_form_color = document.getElementById('update_note_color');
        let id_form_title = document.getElementById('update_note_title');
        let id_form_location = document.getElementById('update_note_location');
        let id_form_intensity = document.getElementById('update_note_intensity');
        let id_form_tags = document.getElementById('update_note_tags');
        let id_form_text = document.getElementById('update_note_text');

        // INPUT VALIDATION
        // note title cannot be blank
        if (id_form_title.value === "") {
            id_note_update_error_message.style.display = 'flex';
            return;
        }
        let note_obj = {
            'id': id_form_id.value,
            'color': id_form_color.value.substring(1,id_form_color.value.length),
            'children': [],
            'location': id_form_location.value,
            'intensity': id_form_intensity.value,
            'parents': [],
            'tags': id_form_tags.value,
            'text': id_form_text.value,
            'title': id_form_title.value,
        }
        let url = URL_BASE + '/note_update/' + JSON.stringify(note_obj);
        // make asynchronous POST request to the API
        const response = await fetch(url, {method: 'GET'});
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Parse the JSON data from the response
        const data = await response.json();
        if (data.statusCode != 200) {
            id_note_create_error_message.textContent = 'Error creating note: non-200 response received...';
            id_note_create_error_message.style.display = 'flex';
            return;
        }
        close_popups();
        get_notes()
            .then(() => {})
            .catch(error => console.error("Error in get_notes:", error));
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: id_button_note_update_submit.onclick: ", error);
    }
}

id_select_sort_by.onclick=function () {
    try {
        // exit if no sort selected or no change made to sort (handles onclick behavior)
        if (id_select_sort_by.value === "" ||
            (id_select_sort_by.value === last_sort_by)) {
            return;
        }
        last_sort_by = id_select_sort_by.value;
        // sort notes
        sort_notes();
        // store view change
        note_obj = {
            'notes': {
                'select_sort_by': id_select_sort_by.value
            }
        }
        view_update(note_obj)
            .then()
            .catch(error => console.error("Error in id_select_sort_by.onclick:", error));
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: id_select_sort_by.onclick: ", error);
    }
}

// ???
window.onload=function () {
    get_notes()
        .then()
        .catch(error => console.error("Error in get_notes:", error));
    get_view_configs('notes')
        .then(() => {
            if (!VIEWS_OBJ) {
                console.log('VIEWS_OBJ is false');
                return;
            }
            let object_keys = Object.keys(VIEWS_OBJ);
            for (let i = 0; i < object_keys.length; i++) {
                let temp_doc = document.getElementById(object_keys[i]);
                // skip assigning value if id cannot be found
                if (temp_doc) {
                    temp_doc.value = VIEWS_OBJ[object_keys[i]];
                }
            }
            // sort notes
            if (id_select_sort_by.value !== "") {
                sort_notes();
            }
        })
        .catch(error => console.error("Error in get_view_configs:", error));
}
