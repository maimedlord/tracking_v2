// HTML variables
let id_button_create = document.getElementById('button_create');
let id_button_delete_no = document.getElementById('button_delete_no');
let id_button_delete_yes = document.getElementById('button_delete_yes');
let id_button_obs_create_submit = document.getElementById('button_obs_create_submit');
let id_button_obs_update_submit = document.getElementById('button_obs_update_submit');
let id_button_obs_observe_submit = document.getElementById('button_obs_observe_submit');
let id_button_observe_delete_submit = document.getElementById('button_observe_delete_submit');
let id_button_update_rec_obs_submit = document.getElementById('button_update_rec_obs_submit');
let id_obs_confirm_delete_container = document.getElementById('obs_confirm_delete_container');
let id_obs_create_container = document.getElementById('obs_create_container');
let id_obs_create_error_message = document.getElementById('obs_create_error_message');
let id_observe_obs_container = document.getElementById('observe_obs_container');
let id_observe_obs_title = document.getElementById('observe_obs_title');
let id_obss_container = document.getElementById('obss_container');
let id_select_sort_by = document.getElementById('select_sort_by');
let id_select_obs_input = document.getElementById('select_obs_input');
let id_observe_obs_id = document.getElementById('observe_obs_id');
let id_update_obs_container = document.getElementById('update_obs_container');
let id_update_rec_obs_container = document.getElementById('update_rec_obs_container');
let id_obs_update_error_message = document.getElementById('obs_update_error_message');
let id_find_obs_by_text = document.getElementById('find_obs_by_text');
let id_clear_find_obs_by_text = document.getElementById('clear_find_obs_by_text');
//
let LAST_SORT_BY = '';
const LCL_OFFSET = new Date().getTimezoneOffset() * 60 * 1000;
let OBSS_OBJ = false;
let VIEWS_OBJ = false;
const URL_BASE = 'http://127.0.0.1:5000/api';

function close_popups() {
    try {
        // Select all divs with the class 'popup'
        const divsToHide = document.querySelectorAll(".popup");
        // Loop through each div and set display to 'none'
        divsToHide.forEach(div => { div.style.display = "none"; });
    } catch (error) {
        // Handle errors
        console.error("There was an error with: close_popups(): ", error);
    }
}

function confirm_delete_popup(obs_id) {
    try {
        close_popups();
        id_obs_confirm_delete_container.style.display = 'flex';
        id_button_delete_yes.onclick=function () {
            delete_obs(obs_id)
                .then(() => {
                    id_obs_confirm_delete_container.style.display = 'none';
                    get_obss()
                        // .then(() => {})
                })
        }
    } catch (error) {
        // Handle errors
        console.error("There was an error with: confirm_delete_popup(): ", error);
    }
}

async function delete_obs(obs_id) {
    try {
        console.log(obs_id);
        let url = URL_BASE + '/obs_delete/' + obs_id;
        // Make an asynchronous GET request to the API
        const response = await fetch(url, {method: 'GET'});
        // Check if the response was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Parse the JSON data from the response
        const data = await response.json();
        get_obss()
            .then(() => {})
            .catch(error => console.error("Error in get_obss():", error));
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: delete_obs(): ", error);
    }
}

function delete_local_observed(id_and_date_str) {
    try {
        // skip if bad input or no obss
        if (!id_and_date_str || !id_and_date_str.includes(',') || !OBSS_OBJ) { return; }
        const temp_array = id_and_date_str.split(',')
        for (let i = 0; i < OBSS_OBJ['data'].length; i++) {
            if (OBSS_OBJ['data'][i]['_id'] === temp_array[0]) {
                for (let j = 0; j < OBSS_OBJ['data'][i]['recordedObss'].length; j++) {
                    if (OBSS_OBJ['data'][i]['recordedObss'][j]['dateCreated'] === temp_array[1]) {
                        OBSS_OBJ['data'][i]['recordedObss'].splice(j, 1);
                        return;
                    }
                }
            }
        }
    } catch (error) {
        // Handle errors
        console.error("There was an error with: delete_local_observed(): ", error);
    }
}

async function delete_observed(id_and_date_str){
    try {
        // skip if not a proper input
        if (!id_and_date_str || !id_and_date_str.includes(',')) {
            return;
        }
        const temp_array = id_and_date_str.split(',')
        let url = URL_BASE + '/observe_delete/' + id_and_date_str;
        // Make an asynchronous GET request to the API
        const response = await fetch(url, {method: 'GET'});
        // Check if the response was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Parse the JSON data from the response
        const data = await response.json();
        if (data.statusCode !== 200) {
            console.log('delete_observed() non-200 Response:\n', data);
            return;
        }
        delete_local_observed(id_and_date_str);// delete from local obs object
        document.getElementById(id_and_date_str).remove();// remove div from view
        // handle changing of number of recordedObss
        let temp_num = parseInt(document.getElementById(temp_array[0] + '_num').innerText);
        temp_num--;
        document.getElementById(temp_array[0]).dataset.recordedobss = temp_num.toString();
        document.getElementById(temp_array[0] + '_num').innerText = temp_num.toString();
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: delete_observed(): ", error);
    }
}

function get_id_from_title(title) {
    try {
        // skip if no observables
        if (OBSS_OBJ === false || OBSS_OBJ.data.length === 0) { return false; }
        for (let i = 0; i < OBSS_OBJ['data'].length; i++) {
            if (OBSS_OBJ['data'][i]['title'] === title) { return OBSS_OBJ['data'][i]['_id']; }
        }
        return false;
    } catch (error) {
        // Handle errors
        console.error("There was an error with: get_id_from_title(): ", error);
    }
}

async function get_obss() {
    try {
        let url = URL_BASE + '/obss_get_all';
        // Make an asynchronous GET request to the API
        const response = await fetch(url, {method: 'GET'});
        // Check if the response was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);// exit
        }
        // Parse the JSON data from the response
        const data = await response.json();
        OBSS_OBJ = data;
        if (parseInt(OBSS_OBJ['statusCode']) === 204) {// exit
            id_obss_container.innerHTML = 'There are no observables.';
            console.log('get_obss() non-200 Response:\n', OBSS_OBJ);
            return;
        }
        // prep
        id_select_obs_input.innerHTML = '<option disabled selected value="">observe...</option>';
        id_obss_container.innerHTML = '';
        // draw the notes
        for (let i = 0; i < OBSS_OBJ['data'].length; i++) {
            // find first time observed
            let temp_first_observed = OBSS_OBJ['data'][i]['recordedObss'].length > 0 ? OBSS_OBJ['data'][i]['recordedObss'][0]['dateCreated'] : '';
            for (let j = 0; j < OBSS_OBJ['data'][i]['recordedObss'].length; j++) {
                if (OBSS_OBJ['data'][i]['recordedObss'][j]['dateCreated'] < temp_first_observed) {
                    temp_first_observed = OBSS_OBJ['data'][i]['recordedObss'][j]['dateCreated'];
                }
            }
            // find last time observed
            let temp_last_observed = OBSS_OBJ['data'][i]['recordedObss'].length > 0 ? OBSS_OBJ['data'][i]['recordedObss'][0]['dateCreated'] : '';
            for (let j = 0; j < OBSS_OBJ['data'][i]['recordedObss'].length; j++) {
                if (OBSS_OBJ['data'][i]['recordedObss'][j]['dateCreated'] > temp_last_observed) {
                    temp_last_observed = OBSS_OBJ['data'][i]['recordedObss'][j]['dateCreated'];
                }
            }
            // prep date for timezone change
            let temp_created_date = new Date(OBSS_OBJ['data'][i]['dateCreated'] + 'Z');
            const temp_id = `${OBSS_OBJ['data'][i]['_id']},list`
            let obs_container = document.createElement('div');
            obs_container.className = 'obs_container';
            obs_container.id = OBSS_OBJ['data'][i]['_id'];
            obs_container.style.borderColor = '#' + OBSS_OBJ['data'][i]['color'];
            obs_container.dataset.datecreated = OBSS_OBJ['data'][i]['dateCreated'];
            obs_container.dataset.firstobserved = temp_first_observed;
            obs_container.dataset.lastobserved = temp_last_observed;
            obs_container.dataset.recordedobss = OBSS_OBJ['data'][i]['recordedObss'].length;
            obs_container.dataset.tags = OBSS_OBJ['data'][i]['tags'].join(',');
            obs_container.dataset.textlength = OBSS_OBJ['data'][i]['text'].length;
            obs_container.dataset.title = OBSS_OBJ['data'][i]['title'];
            obs_container.innerHTML = `
                <div class="observable_menu">
                    <div class="button button_delete"
                         onclick="confirm_delete_popup('${OBSS_OBJ['data'][i]['_id']}')">DELETE</div>
                    <div class="button button_edit"
                         onclick="edit_obs_popup('${OBSS_OBJ['data'][i]['_id']}')">EDIT</div>
                </div>
            `;
            obs_container.innerHTML += `
                ${OBSS_OBJ['data'][i]['_id']}
                <div><b>Title: </b>${OBSS_OBJ['data'][i]['title']}</div>
                <div><b>Description: </b>${OBSS_OBJ['data'][i]['description']}</div>
                <div><b>Date Created: </b>${temp_created_date.toString()}</div>
                <div><b>First Observed: </b>${temp_first_observed}</div>
                <div><b>Last Observed: </b>${temp_last_observed}</div>
                <div><b>Tags: </b>${OBSS_OBJ['data'][i]['tags']}</div>
                <div><b>Text: </b>${OBSS_OBJ['data'][i]['text']}</div>
                <div><b>number of recordedObss: </b><span id="${OBSS_OBJ['data'][i]['_id']}_num">${OBSS_OBJ['data'][i]['recordedObss'].length}</span></div>
                <div class="recorded_obs_show" onclick="show_recordedObss('${temp_id}')"><b>recordedObss</b></div>
                <div class="observed_list" id="${temp_id}" style="display: none;"></div>
            `;
            id_obss_container.append(obs_container);
            // populate observable in input field
            let temp_option = document.createElement('option');
            temp_option.text = OBSS_OBJ['data'][i]['title'];
            temp_option.value = OBSS_OBJ['data'][i]['title'];
            id_select_obs_input.append(temp_option);
        }
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: get_obss(): ", error);
    }
}

// RETURN ???
function get_obs(obs_id) {
    try {
        if (OBSS_OBJ === false || OBSS_OBJ.data.length === 0) { return false; }
        for (let i = 0; i < OBSS_OBJ['data'].length; i++) {
            if (OBSS_OBJ['data'][i]['_id'] === obs_id) {
                return OBSS_OBJ['data'][i];
            }
        }
        return false;
    } catch (error) {
        // Handle errors
        console.error("There was an error with: get_obs(): ", error);
    }
}

function get_recorded_obs(rec_obs_id) {
    try {
        // skip if nothing to get
        if (OBSS_OBJ === false || OBSS_OBJ.data.length === 0 || !rec_obs_id || !rec_obs_id.includes(',')) { return false; }
        const temp_array = rec_obs_id.split(',');
        for (let i = 0; i < OBSS_OBJ['data'].length; i++) {
            if (OBSS_OBJ['data'][i]['_id'] === temp_array[0]) {
                if (OBSS_OBJ['data'][i]['recordedObss'].length === 0) { return false; }
                for (let j = 0; j < OBSS_OBJ['data'][i]['recordedObss'].length; j++) {
                    if (OBSS_OBJ['data'][i]['recordedObss'][j]['dateCreated'] === temp_array[1]) {
                        return OBSS_OBJ['data'][i]['recordedObss'][j];
                    }
                }
            }
        }
    } catch (error) {
        // Handle errors
        console.error("There was an error with: get_recorded_obs(): ", error);
    }
}

async function edit_obs_popup(obs_id) {
    try {
        let id_form_id = document.getElementById('update_obs_id');
        let id_form_color = document.getElementById('update_obs_color');
        let id_form_description = document.getElementById('update_obs_description');
        let id_form_tags = document.getElementById('update_obs_tags');
        let id_form_text = document.getElementById('update_obs_text');
        let id_form_title = document.getElementById('update_obs_title');
        let obs_obj = get_obs(obs_id);
        id_form_id.value = obs_id;
        id_form_color.value = '#' + obs_obj.color;
        id_form_description.value = obs_obj.description;
        id_form_tags.value = obs_obj.tags;
        id_form_text.value = obs_obj.text;
        id_form_title.value = obs_obj.title;
        id_update_obs_container.style.display = 'flex';
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: edit_obs_popup(): ", error);
    }
}

async function edit_observed_popup(id_and_date_str) {
    try {
        let id_form_id = document.getElementById('update_rec_obs_id');
        let id_form_color = document.getElementById('update_rec_obs_color');
        let id_form_intensity = document.getElementById('update_rec_obs_intensity');
        let id_form_feeling_before = document.getElementById('update_rec_obs_feeling_before');
        let id_form_feeling_after = document.getElementById('update_rec_obs_feeling_after');
        let id_form_duration = document.getElementById('update_rec_obs_duration');
        let id_form_response = document.getElementById('update_rec_obs_response');
        let id_form_date = document.getElementById('update_rec_obs_date');
        let id_form_tags = document.getElementById('update_rec_obs_tags');
        let id_form_text = document.getElementById('update_rec_obs_text');
        let id_form_guests = document.getElementById('update_rec_obs_guests');
        let rec_obs = get_recorded_obs(id_and_date_str);
        if (!rec_obs) { return; }// skip if no recorded obs found
        let temp_date = new Date(rec_obs.dateCreated + 'Z');
        temp_date.setTime(temp_date.getTime() - LCL_OFFSET);
        temp_date = temp_date.toISOString().slice(0, -5);
        // skip if no recorded obs
        if (!rec_obs) { return; }
        id_form_id.value = id_and_date_str;
        id_form_color.value = '#' + rec_obs.color;
        id_form_intensity.value = rec_obs.intensity;
        id_form_feeling_before.value = rec_obs.feelingBefore;
        id_form_feeling_after.value = rec_obs.feelingAfter;
        id_form_duration.value = rec_obs.duration;
        id_form_response.value = rec_obs.response;
        id_form_date.value = temp_date;
        id_form_tags.value = rec_obs.tags;
        id_form_text.value = rec_obs.text;
        id_form_guests.value = rec_obs.guests;
        id_update_rec_obs_container.style.display = 'flex';
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: edit_observed_popup(): ", error);
    }
}

function show_recordedObss(obs_id) {
    try {
        // skip if bad input
        if (!obs_id || !obs_id.includes(',')) { return; }
        let obs_container = document.getElementById(obs_id);
        // hide if showing and skip rest
        if (obs_container.style.display === 'flex') {
            obs_container.style.display = 'none';
            obs_container.innerHTML = '';
            return;
        }
        const temp_id_only = obs_id.split(',')[0];
        let obs_obj = get_obs(temp_id_only);
        // skip if bad object or no observables exist
        if (!obs_obj.recordedObss || obs_obj.recordedObss.length === 0) { return; }
        // draw recordedObss in reverse with newest first
        for (let i = obs_obj.recordedObss.length - 1; i >= 0; i--) {
            // prep date
            let temp_created_date = new Date(obs_obj.recordedObss[i].dateCreated + 'Z');
            temp_created_date.setTime(temp_created_date.getTime() - LCL_OFFSET);
            temp_created_date = temp_created_date.toISOString().slice(0, -5);
            let temp_div = document.createElement('div');
            temp_div.className = 'observed_container';
            temp_div.style.borderColor = '#' + obs_obj.recordedObss[i].color;
            temp_div.id = obs_obj.recordedObss[i].id + ',' + obs_obj.recordedObss[i].dateCreated;
            temp_div.innerText = `datetime-utc: ${temp_created_date}
                duration: ${obs_obj.recordedObss[i].duration}
                feeling before: ${obs_obj.recordedObss[i].feelingBefore}
                feeling after: ${obs_obj.recordedObss[i].feelingAfter}
                guests: ${obs_obj.recordedObss[i].guests}
                response: ${obs_obj.recordedObss[i].response}
                tags: ${obs_obj.recordedObss[i].tags}
                intensity: ${obs_obj.recordedObss[i].intensity}
                text: ${obs_obj.recordedObss[i].text}`;
            let temp_div2 = document.createElement('div');
            temp_div2.className = 'rrow10';
            temp_div2.innerHTML += `<div class="button" onclick="delete_observed('${temp_div.id}')">delete</div>`
            temp_div2.innerHTML += `<div class="button" onclick="edit_observed_popup('${temp_div.id}')">edit</div>`
            temp_div.append(temp_div2);
            obs_container.append(temp_div);
        }
        obs_container.style.display = 'flex';
    } catch (error) {
        // Handle errors
        console.error("There was an error with: show_recordedObss(): ", error);
    }
}

function sort_obss() {
    try {
        // Skip if no sort value or no children to sort
        if (!id_select_sort_by.value || !id_obss_container.childNodes.length) {
            return;
        }
        let sorted_arr = Array.from(id_obss_container.childNodes);
        const sort_values = id_select_sort_by.value.split(',');
        const sortMultiplier = sort_values[1] === '0' ? 1 : -1; // thx chatgpt
        sorted_arr = sorted_arr.sort((a, b) => {
            if (/^\d+$/.test(a.dataset[sort_values[0]])) {
                return (parseInt(a.dataset[sort_values[0]]) - parseInt(b.dataset[sort_values[0]])) * sortMultiplier;
            }
            return a.dataset[sort_values[0]].localeCompare(b.dataset[sort_values[0]]) * sortMultiplier;
        });
        id_obss_container.innerHTML = '';
        for (let element of sorted_arr) {
            id_obss_container.append(element);
        }
    } catch (error) {
        // Handle errors
        console.error("There was an error with: sort_obss(): ", error);
    }
}

/// addEventListener and onclick:
id_button_create.onclick=function (){
    try {
        close_popups();
        id_obs_create_container.style.display = 'flex';
    } catch (error) {
        // Handle errors
        console.error("There was an error with: id_button_create.onclick: ", error);
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

id_button_obs_create_submit.onclick=async function () {
    try {
        let id_form_color = document.getElementById('create_obs_color');
        let id_form_description = document.getElementById('create_obs_description');
        let id_form_tags = document.getElementById('create_obs_tags');
        let id_form_text = document.getElementById('create_obs_text');
        let id_form_title = document.getElementById('create_obs_title');
        // INPUT VALIDATION
        // note title cannot be blank
        if (id_form_title.value.toString() === "") {
            id_obs_create_error_message.style.display = 'flex';
            return;
        }
        let obs_obj = {
            'color': id_form_color.value.substring(1,id_form_color.value.length),
            'children': [],
            'description': id_form_description.value,
            'parents': [],
            'tags': id_form_tags.value,
            'text': id_form_text.value,
            'title': id_form_title.value,
        }
        let url = URL_BASE + '/obs_create/' + JSON.stringify(obs_obj);
        // make asynchronous POST request to the API
        const response = await fetch(url, {method: 'GET'});
        // check if response was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Parse the JSON data from the response
        const data = await response.json();
        if (data.statusCode != 200) {
            id_obs_create_error_message.textContent = 'Error updating obs: non-200 response received...';
            id_obs_create_error_message.style.display = 'flex';
            return;
        }
        close_popups();
        id_form_color.value = '#000000';
        id_form_description.value = '';
        id_form_tags.value = '';
        id_form_text.value = '';
        id_form_title.value = '';
        get_obss()
            .then(() => {})
            .catch(error => console.error("Error in get_obsss():", error));
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: id_button_obs_create_submit.onclick: ", error);
    }
}

id_select_obs_input.onchange=function () {
    try {
        close_popups();
        // skip if value is empty
        if (id_select_obs_input.value === "") { return; }
        id_observe_obs_title.innerText = id_select_obs_input.value;
        id_observe_obs_id.value = get_id_from_title(id_select_obs_input.value);
        id_observe_obs_container.style.display = 'flex';
    } catch (error) {
        // Handle errors
        console.error("There was an error with: id_select_obs_input.onclick: ", error);
    }
}

// id_button_observe_delete_submit.onclick=async function () {
//     try {
//         obs_obj = {};
//
//         let url = URL_BASE + '/observe_delete/' + JSON.stringify(obs_obj);
//         // make asynchronous POST request to the API
//         const response = await fetch(url, {method: 'GET'});
//         // check if response was successful
//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }
//         // Parse the JSON data from the response
//         const data = await response.json();
//         if (data.statusCode != 200) {
//             id_obs_create_error_message.textContent = 'Error updating observable: non-200 response received...';
//             id_obs_create_error_message.style.display = 'flex';
//             return;
//         }
//         close_popups();
//         // id_form_id.value = '';
//         // id_form_color.value = '#000000';
//         // id_form_guests.value = '';
//         // id_form_intensity.value = '';
//         // id_form_feeling_before.value = '';
//         // id_form_feeling_after.value = '';
//         // id_form_duration.value = '';
//         // id_form_response.value = '';
//         // id_form_date.value = '';
//         // id_form_tags.value = '';
//         // id_form_text.value = '';
//         get_obss()
//             .then(() => {})
//             .catch(error => console.error("Error in get_obss():", error));
//     } catch (error) {
//         // Handle errors
//         console.error("There was an error with the fetch request: id_button_observe_delete_submit.onclick: ", error);
//     }
// }

id_button_obs_observe_submit.onclick=async function () {
    try {
        const now_date = new Date();
        let id_form_id = document.getElementById('observe_obs_id');
        let id_form_color = document.getElementById('observe_obs_color');
        let id_form_intensity = document.getElementById('observe_obs_intensity');
        let id_form_feeling_before = document.getElementById('observe_obs_feeling_before');
        let id_form_feeling_after = document.getElementById('observe_obs_feeling_after');
        let id_form_duration = document.getElementById('observe_obs_duration');
        let id_form_response = document.getElementById('observe_obs_response');
        let id_form_date = document.getElementById('observe_obs_date');
        let id_form_tags = document.getElementById('observe_obs_tags');
        let id_form_text = document.getElementById('observe_obs_text');
        let id_form_guests = document.getElementById('observe_obs_guests');
        // prep some values
        let temp_id_form_duration = id_form_duration.value === "" ? null : id_form_duration.value;
        let temp_id_form_intensity = id_form_intensity.value === "" ? null : id_form_intensity.value;
        let temp_id_form_tags = id_form_tags.value === "" ? [] : (id_form_tags.value + ',').split(',');
        let temp_id_form_guests = id_form_guests.value === "" ? [] : (id_form_guests.value + ',').split(',');
        if (id_form_date.value === "") {
            id_form_date.value = now_date.toISOString().slice(0, -8);
        } else {
            id_form_date.value = new Date(id_form_date.value).toISOString().slice(0, -5);
        }
        let obs_obj = {
            'color': id_form_color.value.substring(1,id_form_color.value.length),// remove hashtag from color
            'dateCreated': id_form_date.value,
            'duration': temp_id_form_duration,
            'guests': temp_id_form_guests,
            'id': id_form_id.value,
            'intensity': temp_id_form_intensity,
            'feelingBefore': id_form_feeling_before.value,
            'feelingAfter': id_form_feeling_after.value,
            'response': id_form_response.value,
            'tags': temp_id_form_tags,
            'text': id_form_text.value
        }
        let url = URL_BASE + '/obs_observe/' + JSON.stringify(obs_obj);
        // make asynchronous POST request to the API
        const response = await fetch(url, {method: 'GET'});
        // check if response was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Parse the JSON data from the response
        const data = await response.json();
        if (data.statusCode != 200) {
            console.log('Error updating observable: non-200 response received...');
            return;
        }
        close_popups();
        id_form_id.value = '';
        id_form_color.value = '#000000';
        id_form_guests.value = '';
        id_form_intensity.value = '';
        id_form_feeling_before.value = '';
        id_form_feeling_after.value = '';
        id_form_duration.value = '';
        id_form_response.value = '';
        id_form_date.value = '';
        id_form_tags.value = '';
        id_form_text.value = '';
        get_obss()
            .then(() => { sort_obss(); })
            .catch(error => console.error("Error in get_obss():", error));
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: id_button_obs_observe_submit.onclick: ", error);
    }
}

id_button_obs_update_submit.onclick=async function () {
    try {
        let id_form_id = document.getElementById('update_obs_id');
        let id_form_color = document.getElementById('update_obs_color');
        let id_form_description = document.getElementById('update_obs_description');
        let id_form_tags = document.getElementById('update_obs_tags');
        let id_form_text = document.getElementById('update_obs_text');
        let id_form_title = document.getElementById('update_obs_title');
        // INPUT VALIDATION
        // note title cannot be blank
        if (id_form_title.value.toString() === "") {
            id_obs_update_error_message.style.display = 'flex';
            return;
        }
        // handle tags
        let temp_tags = []
        if (id_form_tags.value.toString() !== "") {
            temp_tags = (id_form_tags.value + ',').split(',');
        }
        let obs_obj = {
            '_id': id_form_id.value,
            'color': id_form_color.value.substring(1,id_form_color.value.length),
            'children': [],
            'description': id_form_description.value,
            'parents': [],
            'tags': temp_tags,
            'text': id_form_text.value,
            'title': id_form_title.value,
        }
        let url = URL_BASE + '/obs_update/' + JSON.stringify(obs_obj);
        // make asynchronous POST request to the API
        const response = await fetch(url, {method: 'GET'});
        // check if response was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Parse the JSON data from the response
        const data = await response.json();
        if (data.statusCode != 200) {
            id_obs_update_error_message.textContent = 'Error updating obs: non-200 response received...';
            id_obs_update_error_message.style.display = 'flex';
            return;
        }
        close_popups();
        id_form_id.value = '';
        id_form_color.value = '#000000';
        id_form_description.value = '';
        id_form_tags.value = '';
        id_form_text.value = '';
        id_form_title.value = '';
        get_obss()
            .then(() => {})
            .catch(error => console.error("Error in get_obss():", error));
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: id_button_obs_update_submit.onclick: ", error);
    }
}

id_button_update_rec_obs_submit.onclick=async function () {
    try {
        const now_date = new Date();
        let id_form_id = document.getElementById('update_rec_obs_id');
        let id_form_color = document.getElementById('update_rec_obs_color');
        let id_form_intensity = document.getElementById('update_rec_obs_intensity');
        let id_form_feeling_before = document.getElementById('update_rec_obs_feeling_before');
        let id_form_feeling_after = document.getElementById('update_rec_obs_feeling_after');
        let id_form_duration = document.getElementById('update_rec_obs_duration');
        let id_form_response = document.getElementById('update_rec_obs_response');
        let id_form_date = document.getElementById('update_rec_obs_date');
        let id_form_tags = document.getElementById('update_rec_obs_tags');
        let id_form_text = document.getElementById('update_rec_obs_text');
        let id_form_guests = document.getElementById('update_rec_obs_guests');
        // prep some values
        const temp_array = id_form_id.value.split(',');
        const original_date = temp_array[1];
        let temp_id_form_duration = id_form_duration.value === "" ? null : id_form_duration.value;
        let temp_id_form_intensity = id_form_intensity.value === "" ? null : id_form_intensity.value;
        let temp_id_form_tags = id_form_tags.value === "" ? [] : (id_form_tags.value + ',').split(',');
        let temp_id_form_guests = id_form_guests.value === "" ? [] : (id_form_guests.value + ',').split(',');
        if (id_form_date.value === "") {
            id_form_date.value = now_date.toISOString().slice(0, -5);
        } else {
            id_form_date.value = new Date(id_form_date.value + 'Z').toISOString().slice(0, -5);
        }
        let obs_obj = {
            'color': id_form_color.value.substring(1,id_form_color.value.length),// remove hashtag from color
            'dateCreated': id_form_date.value,
            'duration': temp_id_form_duration,
            'guests': temp_id_form_guests,
            'id': temp_array[0],
            'intensity': temp_id_form_intensity,
            'feelingBefore': id_form_feeling_before.value,
            'feelingAfter': id_form_feeling_after.value,
            'response': id_form_response.value,
            'tags': temp_id_form_tags,
            'text': id_form_text.value,
            'originalDate': original_date
        }
        let url = URL_BASE + '/obs_rec_update/' + JSON.stringify(obs_obj);
        // make asynchronous POST request to the API
        const response = await fetch(url, {method: 'GET'});
        // check if response was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Parse the JSON data from the response
        const data = await response.json();
        if (data.statusCode !== 200) {
            console.log('Error updating observable: non-200 response received...');
            return;
        }
        close_popups();
        id_form_id.value = '';
        id_form_color.value = '#000000';
        id_form_guests.value = '';
        id_form_intensity.value = '';
        id_form_feeling_before.value = '';
        id_form_feeling_after.value = '';
        id_form_duration.value = '';
        id_form_response.value = '';
        id_form_date.value = '';
        id_form_tags.value = '';
        id_form_text.value = '';
        get_obss()
            .then(() => {})
            .catch(error => console.error("Error in get_obss():", error));
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: id_button_obs_observe_submit.onclick: ", error);
    }
}

id_select_sort_by.onchange=function () {
    try {
        // Exit if no sort selected or no change made to sort
        if (!id_select_sort_by.value || id_select_sort_by.value === LAST_SORT_BY) { return; }
        LAST_SORT_BY = id_select_sort_by.value;
        // sort tasks
        sort_obss();
        // store view change
        const TASK_KEY = 'obss';
        const SORT_KEY = 'select_sort_by';
        const TASK_OBJ = {
            [TASK_KEY]: {
                [SORT_KEY]: id_select_sort_by.value
            }
        };
        view_update(TASK_OBJ).catch(error =>
            console.error("Error in id_select_sort_by.onclick:", error)
        );
    } catch (error) {
        console.error("There was an error in id_select_obs_input.onchange:", error);
    }
}

id_find_obs_by_text.onkeyup =function () {
    let visible_obss = Array.from(id_obss_container.childNodes);
    for (let i = 0; i < visible_obss.length; i++) {
        let reason_to_flex = false;
        let temp_val_array = id_find_obs_by_text.value.toLowerCase().split(',');
        let compare_array = visible_obss[i].dataset.tags.toLowerCase().split(',');
        compare_array.push(visible_obss[i].dataset.title.toLowerCase());
        // whoa really?
        for (let j = 0; j < temp_val_array.length; j++) {
            for (let k = 0; k < compare_array.length; k++) {
                if (compare_array[k].includes(temp_val_array[j])) {
                    reason_to_flex = true;
                    break;
                }
                // if (temp_val_array[j].includes(compare_array[k])) {
                //     reason_to_flex = true;
                //     break;
                // }
            }
        }
        if (reason_to_flex) { visible_obss[i].style.display = 'flex'; }
        else { visible_obss[i].style.display = 'none'; }
    }
    id_obss_container.innerHTML = '';
    for (let i = 0; i < visible_obss.length; i++) {
        id_obss_container.appendChild(visible_obss[i]);
    }
}

id_clear_find_obs_by_text.onclick=function () {
    id_find_obs_by_text.value = '';
    let visible_obss = Array.from(id_obss_container.childNodes);
    for (let i = 0; i < visible_obss.length; i++) {
        visible_obss[i].style.display = 'flex';
    }
    id_obss_container.innerHTML = '';
    for (let i = 0; i < visible_obss.length; i++) {
        id_obss_container.appendChild(visible_obss[i]);
    }
}

// ???
window.onload=function () {
    get_obss()
        .then(() => {
            // console.log(OBSS_OBJ);
        })
        .catch(error => console.error("Error in get_obss():", error));

    view_configs_get('obss')
        .then(() => {
            view_apply();
            // sort tasks
            if (id_select_sort_by.value !== "") { sort_obss(); }
        })
        .catch(error => console.error("Error in view_configs_get:", error));
}
