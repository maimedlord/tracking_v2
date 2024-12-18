// HTML variables
let id_button_create = document.getElementById('button_create');
let id_button_delete_no = document.getElementById('button_delete_no');
let id_button_delete_yes = document.getElementById('button_delete_yes');
let id_button_t_update_submit = document.getElementById('button_t_update_submit');
let id_button_task_create_submit = document.getElementById('button_task_create_submit');
let id_button_task_update_submit = document.getElementById('button_task_update_submit');
let id_calendar_view = document.getElementById('calendar_view');
let id_t_update_error_message = document.getElementById('t_update_error_message');
let id_task_choose_one = document.getElementById('task_choose_one');
let id_task_choose_series = document.getElementById('task_choose_series');
let id_task_create_container = document.getElementById('task_create_container');
let id_task_create_error_message = document.getElementById('task_create_error_message');
let id_task_confirm_delete_container = document.getElementById('task_confirm_delete_container');
let id_task_edit_container = document.getElementById('task_edit_container');
let id_task_edit_one = document.getElementById('task_edit_one');
let id_task_edit_series = document.getElementById('task_edit_series');
let id_task_update_error_message = document.getElementById('task_update_error_message');
let id_tasks_container = document.getElementById('tasks_container');
let id_select_sort_by = document.getElementById('select_sort_by');

// calendar variables
const week_array = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
        //
        // split date from id if it's there
        let id_and_date = task_id.split(',');
        let local_task = get_local_task(id_and_date[0]);
        // handle failure
        if (!local_task) {
            throw new Error('local_task returned null...');// exit
        }
        document.getElementById('update_task_id').value = id_and_date[0];
        document.getElementById('update_task_color').value = '#' + local_task['color'];
        document.getElementById('update_task_title').value = local_task['title'];
        document.getElementById('update_task_datestart').value = local_task['dateStart'];
        document.getElementById('update_task_dateend').value = local_task['dateEnd'];
        document.getElementById('update_task_description').value = local_task['description'];
        document.getElementById('update_task_location').value = local_task['location'];
        document.getElementById('update_task_guests').value = local_task['guests'];
        // document.getElementById('update_task_intensity').value = local_task['intensity'];
        document.getElementById('update_task_priority').value = local_task['priority'];
        document.getElementById('update_task_reminder').value = local_task['reminder'];
        document.getElementById('update_task_repeat').value = local_task['repeat'];
        document.getElementById('update_task_tags').value = local_task['tags'];
        document.getElementById('update_task_text').value = local_task['text'];
        id_task_edit_container.style.display = 'flex';
        // skip if no date, else draw 'this' task
        console.log(id_and_date);
        if (id_and_date.length !== 3) {
            return;
        }
        // first, check if exists in recordedTasks and populate with the data if so
        // NEED
        document.getElementById('update_t_id').value = task_id;
        document.getElementById('update_t_datestart').value = id_and_date[1];
        // handle potential dateend nulls
        if (id_and_date[2] !== 'null') {
            document.getElementById('update_t_dateend').value = id_and_date[2];
        }
        else {
            document.getElementById('update_t_dateend').value = '';
        }
        // NEED notes object implementation
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

// NEED TO ADJUST FOR TIMEZONE!
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
            task_container.dataset.priority = TASKS_OBJ['data'][i]['priority'];
            task_container.dataset.textlength = TASKS_OBJ['data'][i]['text'].length;
            task_container.dataset.title = TASKS_OBJ['data'][i]['title'];
            task_container.innerHTML = `
                <div class="note_menu">
                    <div class="button button_delete" 
                         onclick="confirm_delete_popup('${TASKS_OBJ['data'][i]['_id']}')">DELETE</div>
                    <div class="button button_edit" 
                         onclick="edit_task_popup('${TASKS_OBJ['data'][i]['_id']}')">EDIT</div>
                </div>
            `;
            // prep dates for timezone change
            let temp_created_date = new Date(TASKS_OBJ['data'][i]['dateCreated']);
            let temp_end_date = null;
            let temp_start_date = null;
            if (TASKS_OBJ['data'][i]['dateEnd'] !== "") {
                temp_end_date = new Date(TASKS_OBJ['data'][i]['dateEnd']);
            }
            if (TASKS_OBJ['data'][i]['dateStart'] !== "") {
                temp_start_date = new Date(TASKS_OBJ['data'][i]['dateStart']);
            }
            task_container.innerHTML += `
                ${TASKS_OBJ['data'][i]['_id']}
                <div><b>Title:</b> ${TASKS_OBJ['data'][i]['title']}</div>
                <div><b>Description:</b> ${TASKS_OBJ['data'][i]['description']}</div>
                <div><b>Date Created:</b> ${temp_created_date}</div>
                <div><b>Location:</b> ${TASKS_OBJ['data'][i]['location']}</div>
                <div><b>Tags:</b> ${TASKS_OBJ['data'][i]['tags']}</div>
                <div><b>Text:</b> ${TASKS_OBJ['data'][i]['text']}</div>
                <div><b>Priority:</b> ${TASKS_OBJ['data'][i]['priority']}</div>
                <div><b>Date Start:</b> ${temp_start_date.toString()}</div>
                <div><b>Date End:</b> ${temp_end_date.toString()}</div>
                <div><b>reminder:</b> ${TASKS_OBJ['data'][i]['reminder']}</div>
                <div><b>repeat:</b> ${TASKS_OBJ['data'][i]['repeat']}</div>
                <div><b>recordedTasks log drop down goes here</b></div>
            `;
            id_tasks_container.append(task_container);
        }
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: get_tasks(): ", error);
    }
}

function sort_tasks() {
    // Skip if no sort value or no children to sort
    if (!id_select_sort_by.value || !id_tasks_container.childNodes.length) {
        return;
    }
    let sorted_arr = Array.from(id_tasks_container.childNodes);
    const sort_values = id_select_sort_by.value.split(',');
    const sortMultiplier = sort_values[1] === '0' ? 1 : -1; // thx chatgpt
    sorted_arr = sorted_arr.sort((a, b) => {
        if (/^\d+$/.test(a.dataset[sort_values[0]])) {
            return (parseInt(a.dataset[sort_values[0]]) - parseInt(b.dataset[sort_values[0]])) * sortMultiplier;
        }
        return a.dataset[sort_values[0]].localeCompare(b.dataset[sort_values[0]]) * sortMultiplier;
    });
    id_tasks_container.innerHTML = '';
    for (let element of sorted_arr) {
        id_tasks_container.append(element);
    }
}

// calendar functions
function draw_month(month, year) {
    try {
        // prep
        let days_in_month = get_days_in_month(month, year);
        // First moment of the month
        const month_first_moment = new Date(year, month, 1, 0, 0, 0, 0);
        // Last moment of the month: Day 0 of the next month gives the last day of this month
        const month_last_moment = new Date(year, month + 1, 0, 23, 59, 59, 999);
        let started_day_nums = false;
        let written_day_num = 1;
        id_calendar_view.innerHTML = '';
        // every month except for some rare February's have five weeks
        for (let row = 0; row < 5; row++) {
            let temp_row_div = document.createElement('div');
            temp_row_div.className = 'calendar_month_week';
            temp_row_div.id = 'calendar_month_week' + row.toString();
            // each day of the week
            for (let col = 0; col < 7; col++) {
                // determine which day of first week will start day-of-month numbering
                if (!started_day_nums && col === get_weekday_of_month(month, year)) {
                    started_day_nums = true;
                }
                //
                let temp_day_div = document.createElement('div');
                temp_day_div.className = 'calendar_month_day';
                temp_day_div.dataset.col = col.toString();
                temp_day_div.dataset.row = row.toString();
                // add day of the week text
                temp_day_div.textContent += week_array[col] + ' ';
                // add day-of-the-month number
                if (started_day_nums && written_day_num <= days_in_month) {
                    temp_day_div.id = 'month' + written_day_num.toString();
                    temp_day_div.textContent += written_day_num.toString();
                    written_day_num++;
                }
                temp_row_div.append(temp_day_div);
            }
            id_calendar_view.append(temp_row_div);
        }
        // draw tasks on the calendar
        if (!TASKS_OBJ) {
            return;
        }
        // process each task
        let temp_obj = TASKS_OBJ['data'];
        for (let i = 0; i < temp_obj.length; i++) {
            let start_date = new Date(temp_obj[i]['dateStart']);
            let end_date = new Date(temp_obj[i]['dateEnd']);
            // first, draw what is recorded in recordedTasks array
            if (temp_obj[i]['recordedTasks'].length > 0) {
                // console.log(temp_obj[i]['recordedTasks']);
                // console.log('gonna draw me some recordedTasks i am...');
            }
            // skip drawing task if no start date or if start date already in recordedTasks
            // NEED to add check if start date in recordedTasks
            if (!temp_obj[i]['dateStart']) {
                continue;
            }
            // for each one check if recordedTasks already has it and pass if it does...
            // ...
            let repeat_values = temp_obj[i]['repeat'].split(',');
            // console.log('repeat values');
            // console.log(repeat_values);
            // handle tasks with no repeat set up
            if (repeat_values.length === 1) {
                let day_element = document.getElementById('month' + start_date.getDate().toString());
                let temp_div = document.createElement('div');
                temp_div.id = temp_obj[i]['_id'] + ',' + temp_obj[i]['dateStart'] + ',' + temp_obj[i]['dateEnd'];
                temp_div.onclick = () => edit_task_popup(temp_div.id);
                temp_div.style.borderColor = '#' + temp_obj[i]['color'];
                temp_div.style.borderStyle = 'solid';
                temp_div.innerText = temp_obj[i]['title'];
                day_element.append(temp_div);
                continue;
            }
            /// handle daily repeat
            if (repeat_values[0] === 'daily') {
                console.log(repeat_values[0]);
                // handle never
                if (repeat_values[2] === 'never') { // NEEDS

                }
                // handle n occurrences
                if (is_all_digits(repeat_values[2])) {
                    let occurrences = parseInt(repeat_values[2]);
                    let skip_amt = parseInt(repeat_values[1]);
                    // let start_date = new Date(temp_obj[i]['dateStart']);
                    let last_date = new Date(start_date);
                    last_date.setDate(last_date.getDate() + (skip_amt * occurrences));
                    // skip if task end date is before this month
                    if (last_date < month_first_moment) {
                        console.log('the last date of the series was before this months first moment');
                        continue;
                    }
                    console.log('occurrences: ', occurrences.toString());
                    // process n number of tasks in the series and print if in this month
                    for (let ii = 0; ii < occurrences; ii++) {
                        // console.log(temp_obj[i]['title']);
                        let temp_start_date = new Date(start_date);
                        let temp_end_date = new Date(end_date);
                        temp_start_date.setDate(temp_start_date.getDate() + (skip_amt * ii));
                        temp_end_date.setDate(temp_end_date.getDate() + (skip_amt * ii));
                        // console.log('new date in series below');
                        // console.log(temp_start_date);
                        // break out of loop if task in series is past this month
                        if (temp_start_date > month_last_moment) {
                            // console.log('task in series after this month');
                            break;
                        }
                        // skip if task in series is before this month
                        if (temp_start_date < month_first_moment) {
                            // console.log('task in series before this month');
                            continue;
                        }
                        // check against recordedTasks to see if already there...

                        //
                        let month_day = temp_start_date.getDate();
                        let day_element = document.getElementById('month' + month_day.toString());
                        // console.log(day_element);
                        let temp_div = document.createElement('div');
                        temp_div.id = temp_obj[i]['_id'] + ',' + temp_start_date.toISOString().slice(0, -5) + ',' +
                            temp_end_date.toISOString().slice(0, -5);
                        temp_div.onclick = () => edit_task_popup(temp_div.id);
                        temp_div.style.borderColor = '#' + temp_obj[i]['color'];
                        temp_div.style.borderStyle = 'solid';
                        temp_div.innerText = temp_obj[i]['title'];
                        day_element.append(temp_div);
                    }
                }
            }
        }
    } catch (error) {
        // Handle errors
        console.error("There was an error in: draw_month(): ", error);
    }

}

// RETURN number of days in month: 28..31
function get_days_in_month(month, year) {
    // Month is zero-based: January = 0, December = 11
    return new Date(year, month + 1, 0).getDate();
}

// RETURN day of week: 0..6 starting with Sunday
function get_weekday_of_month(month, year) {
    // Month is zero-based: January = 0, December = 11
    const firstDay = new Date(year, month, 1);
    return firstDay.getDay();
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
// NEEDS update to draw_month parameters
id_button_task_create_submit.onclick=async function () {
    try {
        let id_form_color = document.getElementById('create_task_color');
        let id_form_dateend = document.getElementById('create_task_dateend');
        let id_form_datestart = document.getElementById('create_task_datestart');
        let id_form_description = document.getElementById('create_task_description');
        let id_form_guests = document.getElementById('create_task_guests');
        // let id_form_intensity = document.getElementById('create_task_intensity');
        let id_form_location = document.getElementById('create_task_location');
        let id_form_priority = document.getElementById('create_task_priority');
        let id_form_reminder = document.getElementById('create_task_reminder');
        let id_form_repeat = document.getElementById('create_task_repeat');
        // let id_form_status = document.getElementById('create_task_status');
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
            // 'intensity': id_form_intensity.value,
            'location': id_form_location.value,
            'parents': [],
            'priority': id_form_priority.value,
            'reminder': id_form_reminder.value,
            'repeat': id_form_repeat.value,
            // 'status': id_form_status.value,
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
        // id_form_intensity.value = '';
        id_form_location.value = '';
        id_form_priority.value = '';
        // id_form_status.value = '';
        id_form_tags.value = '';
        id_form_title.value = '';
        id_form_text.value = '';
        get_tasks()
            .then(() => {
                // CHANGE
                draw_month(11, 2024);
            })
            .catch(error => console.error("Error in get_tasks:", error));
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: id_button_task_create_submit.onclick: ", error);
    }
}

id_button_t_update_submit.onclick=async  function () {
    let id_form_id = document.getElementById('update_t_id');
    let id_form_dateend = document.getElementById('update_t_dateend');
    let id_form_datestart = document.getElementById('update_t_datestart');
    let id_form_guests = document.getElementById('update_t_guests');
    let id_form_intensity = document.getElementById('update_t_intensity');
    let id_form_location = document.getElementById('update_t_location');
    let id_form_tags = document.getElementById('update_t_tags');
    let id_form_note = document.getElementById('update_t_note');
    // INPUT VALIDATION
    // fix dates before populating object
    let date_end = null;
    let date_start = null;
    if (id_form_dateend.value !== "") {
        date_end = new Date(id_form_dateend.value).toISOString();
    }
    if (id_form_datestart.value !== "") {
        date_start = new Date(id_form_datestart.value).toISOString();
    }
    let recorded_task_obj = {
        'id': id_form_id.value,
        'dateEnd': date_end,
        'dateStart': date_start,
        'guests': id_form_guests.value,
        'intensity': id_form_intensity.value,
        'location': id_form_location.value,
        'note': id_form_note.value,
        'tags': id_form_tags.value,
    }
    let url = URL_BASE + '/t_update/' + JSON.stringify(recorded_task_obj);
    // make asynchronous POST request to the API
    let response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    // Parse the JSON data from the response
    let data = await response.json();
    if (data.statusCode != 200) {
        id_t_update_error_message.textContent = 'Error creating task: non-200 response received...';
        id_t_update_error_message.style.display = 'flex';
        return;
    }
    close_popups();
    get_tasks()
        .then(() => {
            // CHANGE
            draw_month(11, 2024);
        })
        .catch(error => console.error("Error in get_tasks:", error));
}
// NEEDS update to draw_month parameters
id_button_task_update_submit.onclick = async function () {
    try {
        let id_form_id = document.getElementById('update_task_id');
        let id_form_color = document.getElementById('update_task_color');
        let id_form_dateend = document.getElementById('update_task_dateend');
        let id_form_datestart = document.getElementById('update_task_datestart');
        let id_form_description = document.getElementById('update_task_description');
        let id_form_guests = document.getElementById('update_task_guests');
        let id_form_location = document.getElementById('update_task_location');
        let id_form_priority = document.getElementById('update_task_priority');
        let id_form_reminder = document.getElementById('update_task_reminder');
        let id_form_repeat = document.getElementById('update_task_repeat');
        let id_form_tags = document.getElementById('update_task_tags');
        let id_form_text = document.getElementById('update_task_text');
        let id_form_title = document.getElementById('update_task_title');
        // INPUT VALIDATION
        // task title cannot be blank
        if (id_form_title.value === "") {
            id_t_update_error_message.style.display = 'flex';
            return;
        }
        // fix dates before populating object
        let date_end = null;
        let date_start = null;
        if (id_form_dateend.value !== "") {
            date_end = new Date(id_form_dateend.value).toISOString();
        }
        if (id_form_datestart.value !== "") {
             date_start = new Date(id_form_datestart.value).toISOString();
        }
        let task_obj = {
            'id': id_form_id.value,
            'color': id_form_color.value.substring(1, id_form_color.value.length),
            'children': [],
            'description': id_form_description.value,
            'dateEnd': date_end,
            'dateStart': date_start,
            'guests': id_form_guests.value,
            'location': id_form_location.value,
            'parents': [],
            'priority': id_form_priority.value,
            'reminder': id_form_reminder.value,
            'repeat': id_form_repeat.value,
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
            .then(() => {
                // CHANGE
                draw_month(11, 2024);
            })
            .catch(error => console.error("Error in get_tasks:", error));
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: id_button_task_update_submit.onclick: ", error);
    }
}

id_select_sort_by.onclick = function () {
    try {
        // Exit if no sort selected or no change made to sort
        if (!id_select_sort_by.value || id_select_sort_by.value === last_sort_by) {
            return;
        }
        last_sort_by = id_select_sort_by.value;
        // Sort tasks
        sort_tasks();
        // Store view change
        const TASK_KEY = 'tasks';
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
        console.error("There was an error in id_select_sort_by.onclick:", error);
    }
};

id_task_choose_one.onclick = function () {
    id_task_edit_series.style.display = 'none';
    id_task_edit_one.style.display = 'flex';
}

id_task_choose_series.onclick = function () {
    id_task_edit_one.style.display = 'none';
    id_task_edit_series.style.display = 'flex';
}

// ???
window.onload=function () {
    get_tasks().catch(error => console.error("Error in get_tasks:", error));
    view_configs_get('tasks')
        .then(() => {
            view_apply();
            // sort tasks
            if (id_select_sort_by.value !== "") {
                sort_tasks();
            }
            draw_month(11, 2024);
        })
        .catch(error => console.error("Error in view_configs_get:", error));
}