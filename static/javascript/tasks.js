// HTML variables
let id_button_create = document.getElementById('button_create');
let id_button_delete_no = document.getElementById('button_delete_no');
let id_button_delete_yes = document.getElementById('button_delete_yes');
let id_button_task_create_submit = document.getElementById('button_task_create_submit');
let id_button_task_update_submit = document.getElementById('button_task_update_submit');
let id_task_create_container = document.getElementById('task_create_container');
let id_task_create_error_message = document.getElementById('task_create_error_message');
let id_task_confirm_delete_container = document.getElementById('task_confirm_delete_container');
let id_task_edit_container = document.getElementById('task_edit_container');
let id_task_update_error_message = document.getElementById('task_update_error_message');
let id_tasks_container = document.getElementById('tasks_container');
let id_select_sort_by = document.getElementById('select_sort_by');

// other variables
let last_sort_by = '';
let TASKS_OBJ = false;
const OFFSET_VALUE = new Date().getTimezoneOffset() * 60 * 1000;
let VIEWS_OBJ = false;
const URL_BASE = 'http://127.0.0.1:5000/api';

function close_popups() {
    // Select all divs with the class 'popup'
    const divsToHide = document.querySelectorAll(".popup");
    // Loop through each div and set display to 'none'
    divsToHide.forEach(div => {
        div.style.display = "none";
    });
}

function confirm_delete_popup(task_id) {
    try {
        close_popups();
        id_task_confirm_delete_container.style.display = 'flex';
        id_button_delete_yes.onclick=function () {
            delete_task(task_id)
                .then(() => {
                    console.log('button delete yes was clicked');
                    id_task_confirm_delete_container.style.display = 'none';
                    get_tasks()
                        .then(() => {
                            console.log('get_tasks activated');
                        })
                })
        }
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: confirm_delete_popup(): ", error);
    }
}

async function delete_task(task_id) {
    try {
        console.log(task_id);
        let url = URL_BASE + '/task_delete/' + task_id;
        // Make an asynchronous GET request to the API
        const response = await fetch(url, {method: 'GET'});
        // Check if the response was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Parse the JSON data from the response
        const data = await response.json();
        console.log(response);
        get_tasks()
            .then(() => {})
            .catch(error => console.error("Error in get_tasks:", error));
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: delete_task(): ", error);
    }
}

function edit_task_popup(task_id) {
    try {
        close_popups();
        let local_task = get_local_task(task_id);
        // handle failure
        if (!local_task) {
            throw new Error('local_task returned null...');// exit
        }
        document.getElementById('update_task_id').value = task_id;
        document.getElementById('update_task_color').value = '#' + local_task['color'];
        document.getElementById('update_task_title').value = local_task['title'];
        document.getElementById('update_task_datestart').value = local_task['dateStart'];
        document.getElementById('update_task_dateend').value = local_task['dateEnd'];
        document.getElementById('update_task_description').value = local_task['description'];
        document.getElementById('update_task_location').value = local_task['location'];
        document.getElementById('update_task_guests').value = local_task['guests'];
        document.getElementById('update_task_intensity').value = local_task['intensity'];
        document.getElementById('update_task_priority').value = local_task['priority'];
        // document.getElementById('update_task_reminder').value = local_task['reminder'];
        // document.getElementById('update_task_repeat').value = local_task['repeat'];
        document.getElementById('update_task_tags').value = local_task['tags'];
        document.getElementById('update_task_text').value = local_task['text'];
        id_task_edit_container.style.display = 'flex';
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: edit_task_popup(): ", error);
    }
}

// RETURN null if no local task found || task object if found
function get_local_task(task_id) {
    try {
        if (TASKS_OBJ['data'].length < 1) {
            return null;
        }
        for (let i = 0; i < TASKS_OBJ['data'].length; i++) {
            if (TASKS_OBJ['data'][i]['_id'] === task_id) {
                return TASKS_OBJ['data'][i];
            }
        }
        return null;
    } catch (error) {
        // Handle errors
        console.error("There was an error with get_local_task(): ", error);
    }
}

async function get_tasks() {
    try {
        let url = URL_BASE + '/tasks_get_all';
        // Make an asynchronous GET request to the API
        const response = await fetch(url, {method: 'GET'});
        // Check if the response was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);// exit
        }
        // Parse the JSON data from the response
        const data = await response.json();
        TASKS_OBJ = data;
        if (parseInt(TASKS_OBJ['statusCode']) === 204) {// exit
            id_tasks_container.innerHTML = 'There are no tasks.';
            console.log('get_tasks() non-200 Response:\n', TASKS_OBJ);
            return;
        }
        id_tasks_container.innerHTML = '';
        // draw the notes
        for (let i = 0; i < TASKS_OBJ['data'].length; i++) {
            let task_container = document.createElement('div');
            task_container.className = 'task_container';
            task_container.id = TASKS_OBJ['data'][i]['_id'];
            task_container.style.borderColor = '#' + TASKS_OBJ['data'][i]['color'];
            task_container.dataset.datecreated = TASKS_OBJ['data'][i]['dateCreated'];
            task_container.dataset.dateend = TASKS_OBJ['data'][i]['dateEnd'];
            task_container.dataset.datestart = TASKS_OBJ['data'][i]['dateStart'];
            task_container.dataset.intensity = TASKS_OBJ['data'][i]['intensity'];
            task_container.dataset.priority = TASKS_OBJ['data'][i]['priority'];
            task_container.dataset.textlength = TASKS_OBJ['data'][i]['text'].length;
            task_container.dataset.title = TASKS_OBJ['data'][i]['title'];
            task_container.innerHTML = '<div class="note_menu"><div class="button button_delete" onclick="confirm_delete_popup(\'' + TASKS_OBJ['data'][i]['_id'] + '\')">DELETE</div><div class="button button_edit" onclick="edit_task_popup(\'' + TASKS_OBJ['data'][i]['_id'] + '\')">EDIT</div></div>';
            task_container.innerHTML += TASKS_OBJ['data'][i]['_id'] + "<br>title: " + TASKS_OBJ['data'][i]['title'] + "<br>description: " + TASKS_OBJ['data'][i]['description'] +
                "<br>dateCreated: " + TASKS_OBJ['data'][i]['dateCreated'] + "<br>location: " + TASKS_OBJ['data'][i]['location'] +
                "<br>intensity: " + TASKS_OBJ['data'][i]['intensity'] + "<br>tags: " + TASKS_OBJ['data'][i]['tags'] +
                "<br>text: " + TASKS_OBJ['data'][i]['text'] + "<br>priority: " + TASKS_OBJ['data'][i]['priority'] +
                "<br>dateStart: " + TASKS_OBJ['data'][i]['dateStart'] + "<br>dateEnd: " + TASKS_OBJ['data'][i]['dateEnd'];
            id_tasks_container.append(task_container);
        }
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: get_tasks(): ", error);
    }
}

// onclicks:
id_button_create.onclick=function () {
    try {
        close_popups();
        id_task_create_container.style.display = 'flex';
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
id_button_task_create_submit.onclick=async function () {
    try {
        let id_form_color = document.getElementById('create_task_color');
        let id_form_dateend = document.getElementById('create_task_dateend');
        let id_form_datestart = document.getElementById('create_task_datestart');
        let id_form_description = document.getElementById('create_task_description');
        let id_form_guests = document.getElementById('create_task_guests');
        let id_form_intensity = document.getElementById('create_task_intensity');
        let id_form_location = document.getElementById('create_task_location');
        let id_form_priority = document.getElementById('create_task_priority');
        let id_form_tags = document.getElementById('create_task_tags');
        let id_form_title = document.getElementById('create_task_title');
        let id_form_text = document.getElementById('create_task_text');
        // INPUT VALIDATION
        // note title cannot be blank
        if (id_form_title.value.toString() === "") {
            id_task_create_error_message.style.display = 'flex';
            return;
        }
        // fix dates before populating object
        let date_end = "";
        let date_start = ""
        if (id_form_dateend.value === "") {
            date_end = null;
        }
        else {
            date_end = new Date(new Date(id_form_dateend.value) + OFFSET_VALUE).toISOString()
        }
        if (id_form_datestart.value === "") {
            date_start = null;
        }
        else {
            date_start = new Date(new Date(id_form_datestart.value) + OFFSET_VALUE).toISOString()
        }
        let task_obj = {
            'color': id_form_color.value.substring(1,id_form_color.value.length),
            'children': [],
            'dateEnd': date_end,
            'dateStart': date_start,
            'description': id_form_description.value,
            'guests': id_form_guests.value,
            'intensity': id_form_intensity.value,
            'location': id_form_location.value,
            'parents': [],
            'priority': id_form_priority.value,
            'reminder': '',
            'repeat': '',
            'tags': id_form_tags.value,
            'text': id_form_text.value,
            'title': id_form_title.value,
        }
        let url = URL_BASE + '/task_create/' + JSON.stringify(task_obj);
        // make asynchronous POST request to the API
        const response = await fetch(url, {method: 'GET'});
        // check if response was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Parse the JSON data from the response
        const data = await response.json();
        if (data.statusCode != 200) {
            id_task_update_error_message.textContent = 'Error updating task: non-200 response received...';
            id_task_update_error_message.style.display = 'flex';
            return;
        }
        close_popups()
        // reset form values
        id_form_color.value = '#FFFFFF';
        id_form_dateend.value = '';
        id_form_datestart.value = '';
        id_form_description.value = '';
        id_form_guests.value = '';
        id_form_intensity.value = '';
        id_form_location.value = '';
        id_form_priority.value = '';
        id_form_tags.value = '';
        id_form_title.value = '';
        id_form_text.value = '';
        get_tasks()
            .then(() => {})
            .catch(error => console.error("Error in get_tasks:", error));
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: id_button_task_create_submit.onclick: ", error);
    }
}
id_button_task_update_submit.onclick = async function () {
    try {
        let id_form_id = document.getElementById('update_task_id');
        let id_form_color = document.getElementById('update_task_color');
        let id_form_dateend = document.getElementById('update_task_dateend');
        let id_form_datestart = document.getElementById('update_task_datestart');
        let id_form_description = document.getElementById('update_task_description');
        let id_form_guests = document.getElementById('update_task_guests');
        let id_form_intensity = document.getElementById('update_task_intensity');
        let id_form_location = document.getElementById('update_task_location');
        let id_form_priority = document.getElementById('update_task_priority');
        let id_form_tags = document.getElementById('update_task_tags');
        let id_form_text = document.getElementById('update_task_text');
        let id_form_title = document.getElementById('update_task_title');
        // INPUT VALIDATION
        // task title cannot be blank
        if (id_form_title.value === "") {
            id_task_update_error_message.style.display = 'flex';
            return;
        }
        // fix dates before populating object
        let date_end = null;
        let date_start = null;
        if (id_form_dateend.value !== "") {
            date_end = new Date(new Date(id_form_dateend.value) + OFFSET_VALUE).toISOString();
        }
        if (id_form_datestart.value !== "") {
            date_start = new Date(new Date(id_form_datestart.value) + OFFSET_VALUE).toISOString();
        }
        let task_obj = {
            'id': id_form_id.value,
            'color': id_form_color.value.substring(1, id_form_color.value.length),
            'children': [],
            'description': id_form_description.value,
            'dateEnd': date_end,
            'dateStart': date_start,
            'guests': id_form_guests.value,
            'intensity': id_form_intensity.value,
            'location': id_form_location.value,
            'parents': [],
            'priority': id_form_priority.value,
            'tags': id_form_tags.value,
            'text': id_form_text.value,
            'title': id_form_title.value,
        }
        let url = URL_BASE + '/task_update/' + JSON.stringify(task_obj);
        // make asynchronous POST request to the API
        let response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Parse the JSON data from the response
        let data = await response.json();
        if (data.statusCode != 200) {
            id_task_create_error_message.textContent = 'Error creating task: non-200 response received...';
            id_task_create_error_message.style.display = 'flex';
            return;
        }
        close_popups();
        get_tasks()
            .then(() => {})
            .catch(error => console.error("Error in get_tasks:", error));
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: id_button_task_update_submit.onclick: ", error);
    }
}


// ???
window.onload=function () {
    get_tasks()
        .then()
        .catch(error => console.error("Error in get_tasks:", error));
    // get_view_configs('tasks')
    //     .then(() => {
    //         if (!VIEWS_OBJ) {
    //             console.log('VIEWS_OBJ is false');
    //             return;
    //         }
    //         let object_keys = Object.keys(VIEWS_OBJ);
    //         for (let i = 0; i < object_keys.length; i++) {
    //             let temp_doc = document.getElementById(object_keys[i]);
    //             // skip assigning value if id cannot be found
    //             if (temp_doc) {
    //                 temp_doc.value = VIEWS_OBJ[object_keys[i]];
    //             }
    //         }
    //         // sort notes
    //         if (id_select_sort_by.value !== "") {
    //             sort_notes();
    //         }
    //     })
    //     .catch(error => console.error("Error in get_view_configs:", error));
}