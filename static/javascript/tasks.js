// HTML variables
let id_button_create = document.getElementById('button_create');
let id_button_delete_no = document.getElementById('button_delete_no');
let id_button_delete_yes = document.getElementById('button_delete_yes');
let id_button_month_next = document.getElementById('button_month_next');
let id_button_month_now = document.getElementById('button_month_now');
let id_button_month_prev = document.getElementById('button_month_prev');
let id_button_t_delete_submit = document.getElementById('button_t_delete_submit');
let id_button_t_update_submit = document.getElementById('button_t_update_submit');
let id_button_task_create_submit = document.getElementById('button_task_create_submit');
let id_button_task_update_submit = document.getElementById('button_task_update_submit');
let id_calendar_view = document.getElementById('calendar_view');
let id_calendar_title = document.getElementById('calendar_title');
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
let cal_now_month = new Date().getMonth();
let cal_now_year = new Date().getFullYear();
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

// RETURN input string if no date string found || strings converted to local time if found
function convert_date_strings_to_local(input_string, plus_or_minus) {
    if (input_string.includes('T')) {
        // if plus_or_minus is false remove OFFSET_VALUE, if true then add
        let OFFSET_AMT = plus_or_minus ? -OFFSET_VALUE : OFFSET_VALUE;
        let return_string = input_string.split(',');
        for (let ii = 0; ii < return_string.length; ii++) {
            if (return_string[ii].includes('T')) {
                return_string[ii] = new Date(new Date(return_string[ii] + 'Z') - OFFSET_AMT).toISOString().slice(0, -5);
            }
        }
        return return_string.join(',');
    }
    return input_string;
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
            .then(() => {
                draw_month(11, 2024);// NEED
            })
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
        let id_and_dates = task_id.split(',');
        let local_task = get_local_task(id_and_dates[0]);
        // handle failure
        if (!local_task) {
            throw new Error('local_task returned null...');// exit
        }
        // prep dates as UTC
        let temp_start_date = '';
        if (local_task['dateStart'] !== null) {
            temp_start_date = new Date(local_task['dateStart'] + 'Z');
            temp_start_date = new Date(temp_start_date - OFFSET_VALUE).toISOString().slice(0,-5);
        }
        let temp_end_date = '';
        if (local_task['dateEnd'] !== null) {
            temp_end_date = new Date(local_task['dateEnd'] + 'Z');
            temp_end_date = new Date(temp_end_date - OFFSET_VALUE).toISOString().slice(0,-5);
        }
        // take care of dates in repeat if there
        // true == forward in time
        let repeat_vals = convert_date_strings_to_local(local_task['repeat'], false);
        // console.log('dateStart', local_task['dateStart']);
        document.getElementById('update_task_id').value = id_and_dates[0];
        document.getElementById('update_task_color').value = '#' + local_task['color'];
        document.getElementById('update_task_title').value = local_task['title'];
        document.getElementById('update_task_datestart').value = temp_start_date;
        document.getElementById('update_task_dateend').value = temp_end_date;
        document.getElementById('update_task_description').value = local_task['description'];
        document.getElementById('update_task_location').value = local_task['location'];
        document.getElementById('update_task_guests').value = local_task['guests'];
        // document.getElementById('update_task_intensity').value = local_task['intensity'];
        document.getElementById('update_task_priority').value = local_task['priority'];
        document.getElementById('update_task_reminder').value = local_task['reminder'];
        document.getElementById('update_task_repeat').value = repeat_vals;
        document.getElementById('update_task_tags').value = local_task['tags'];
        document.getElementById('update_task_text').value = local_task['text'];
        id_task_edit_container.style.display = 'flex';
        // set recordedTask form id in case user tries to create recordedTask, hide delete button
        document.getElementById('update_t_id').value = task_id;
        id_button_t_delete_submit.style.display = 'none';
        // skip if no date, else draw 'this' task
        if (id_and_dates.length !== 3) {
            return;
        }
        // first, check if exists in recordedTasks and populate with the data if so
        // NEED
        // handle UTC to local time conversion
        const local_start_date = new Date(new Date(id_and_dates[1] + 'Z') - OFFSET_VALUE);
        document.getElementById('update_t_datestart').value = local_start_date.toISOString().slice(0,-5);
        // console.log('dateStart', local_start_date);
        // handle potential dateend nulls and then UTC to local time conversion
        if (id_and_dates[2] !== '') {
            const local_end_date = new Date(new Date(id_and_dates[2] + 'Z') - OFFSET_VALUE);
            document.getElementById('update_t_dateend').value = local_end_date.toISOString().slice(0,-5);
        }
        else {
            document.getElementById('update_t_dateend').value = '';
        }
        // grab rest of data from recordedTasks if it is there
        const found_rTask = get_recordedTask(task_id, local_task['recordedTasks']);
        if (found_rTask < 0) {
            // blank out form values every redraw
            document.getElementById('update_t_guests').value = '';
            document.getElementById('update_t_intensity').value = '';
            document.getElementById('update_t_location').value = '';
            document.getElementById('update_t_note').value = '';
            document.getElementById('update_t_status').value = '';
            document.getElementById('update_t_tags').value = '';
            return;
        }
        document.getElementById('update_t_guests').value = local_task['recordedTasks'][found_rTask]['guests'];
        document.getElementById('update_t_intensity').value = local_task['recordedTasks'][found_rTask]['intensity'];
        document.getElementById('update_t_location').value = local_task['recordedTasks'][found_rTask]['location'];
        document.getElementById('update_t_note').value = local_task['recordedTasks'][found_rTask]['note'];
        document.getElementById('update_t_status').value = local_task['recordedTasks'][found_rTask]['status'];
        document.getElementById('update_t_tags').value = local_task['recordedTasks'][found_rTask]['tags'];
        // display delete button
        id_button_t_delete_submit.style.display = 'block';
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
                <div class="task_menu">
                    <div class="button button_delete" 
                         onclick="confirm_delete_popup('${TASKS_OBJ['data'][i]['_id']}')">DELETE</div>
                    <div class="button button_edit" 
                         onclick="edit_task_popup('${TASKS_OBJ['data'][i]['_id']}')">EDIT</div>
                </div>
            `;
            // prep dates for timezone change
            let temp_created_date = new Date(TASKS_OBJ['data'][i]['dateCreated']);
            let temp_end_date = "no end date";
            let temp_start_date = "no start date";
            if (TASKS_OBJ['data'][i]['dateEnd'] !== null) {
                temp_end_date = new Date(TASKS_OBJ['data'][i]['dateEnd'] + 'Z');
            }
            if (TASKS_OBJ['data'][i]['dateStart'] !== null) {
                temp_start_date = new Date(TASKS_OBJ['data'][i]['dateStart'] + 'Z');
            }
            // take care of dates in repeat if there
            let repeat_vals = convert_date_strings_to_local(TASKS_OBJ['data'][i]['repeat']);
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
                <div><b>repeat:</b> ${repeat_vals}</div>
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

/// calendar functions
// RETURNS None if no DST end found || LOCALIZED date if found
// ChatGPT
function getDSTEnd(year) {
    // Find the first day of November
    const novemberFirst = new Date(year, 10, 1); // Month is 0-indexed (10 = November)
    // Find the first Sunday of November
    const firstSunday = new Date(
        novemberFirst.getTime() + ((7 - novemberFirst.getDay()) % 7) * 24 * 60 * 60 * 1000
    );
    // Set the time to 2:00 AM local time
    firstSunday.setHours(2, 0, 0, 0);
    return firstSunday;
}

// RETURNS None if no DST start found || LOCALIZED date if found
// ChatGPT
function getDSTStart(year) {
    const standardOffset = new Date(year, 0, 1).getTimezoneOffset(); // Offset in standard time
    for (let month = 0; month < 12; month++) {
        for (let day = 1; day <= 31; day++) {
            const date = new Date(year, month, day);
            if (date.getMonth() !== month) break; // Handle invalid dates (e.g., Feb 30)
            const currentOffset = date.getTimezoneOffset();
            if (currentOffset < standardOffset) {
                // DST starts at 2:00 AM local time
                return new Date(year, month, day, 2, 0, 0);
            }
        }
    }
    return null; // No DST transition found
}

// RETURNS ???
function set_cal_month_next(month, year) {
    console.log(month, year);
    if (month === 11) {
        cal_now_month = 0;
        cal_now_year = ++year;
    }
    else {
        cal_now_month = ++month;
    }
    // set calendar_view data to current month
    id_calendar_view.dataset.view_config = cal_now_month.toString() + ',' + cal_now_year.toString();
}

// RETURNS ???
function set_cal_month_prev(month, year) {
    if (month === 1) {
        cal_now_month = 11;
        cal_now_year = --year;
    }
    else {
        cal_now_month = --month;
    }
    // set calendar_view data to current month
    id_calendar_view.dataset.view_config = cal_now_month.toString() + ',' + cal_now_year.toString();
}

function draw_month(month, year) {
    try {
        ///// draw the calendar for this month
        // number of days in month
        let days_in_month = get_days_in_month(month, year);
        // First moment of the month
        const month_first_moment = new Date(year, month, 1, 0, 0, 0, 0);
        // Last moment of the month: Day 0 of the next month gives the last day of this month
        const month_last_moment = new Date(year, month + 1, 0, 23, 59, 59, 999);
        let started_day_nums = false; // used to determine if month days have started assignment
        let written_day_num = 1; // first day of the month for every month :D
        // write month name
        id_calendar_title.innerText = new Date(year, month).toLocaleString('default', { month: 'long' }) +
        ': ' + year;
        id_calendar_view.innerHTML = ''; // wipe before re-drawing calendar
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
        ///// draw tasks on the calendar
        /// skip if no tasks
        if (!TASKS_OBJ) {
            console.log('no tasks to draw');
            return;
        }
        let temp_obj = TASKS_OBJ['data'];
        if (!temp_obj || temp_obj.length < 1) {
            console.log('no tasks to draw');
            return;
        }
        //// process each task
        for (let i = 0; i < temp_obj.length; i++) {
            // first, draw any recordedTasks (they don't rely on dateStart)
            let rec_tasks = temp_obj[i]['recordedTasks']
            if (rec_tasks && rec_tasks.length > 0) {
                for (let ii = 0; ii < rec_tasks.length; ii++) {
                    // id: str:task_ObjectId,str:dateStart,str:dateEnd
                    let id_and_dates = rec_tasks[ii]['id'].split(',');
                    // handle dates
                    let temp_start_date = '';
                    if (id_and_dates[1] !== "") {
                        temp_start_date = new Date(id_and_dates[1] + 'Z');
                        // skip this recordedTask if start date is not in this month
                        if (temp_start_date < month_first_moment || temp_start_date > month_last_moment) {
                            continue;
                        }
                    }
                    let temp_end_date = '';
                    if (id_and_dates[2] !== "") {
                        temp_end_date = new Date(id_and_dates[1] + 'Z');
                    }
                    let month_day = temp_start_date.getDate();// should be local time?
                    let day_element = document.getElementById('month' + month_day.toString());
                    let temp_div = document.createElement('div');
                    temp_div.id = rec_tasks[ii]['id'];
                    temp_div.onclick = () => edit_task_popup(temp_div.id);
                    temp_div.style.borderColor = '#' + temp_obj[i]['color'];
                    temp_div.style.borderStyle = 'solid';
                    temp_div.innerText = temp_obj[i]['title'];
                    day_element.append(temp_div);
                }
            }
            // second, draw single and repetitive tasks that are not already recordedTasks
            // skip this task if it does not have a dateStart
            if (!temp_obj[i]['dateStart']) {
                continue;
            }
            // set as UTC
            let start_date_utc = new Date(temp_obj[i]['dateStart'] + 'Z');
            let end_date_utc = null;
            if (temp_obj[i]['dateEnd'] !== null) {
                end_date_utc = new Date(temp_obj[i]['dateEnd'] + 'Z');
            }
            // repeat_values possibilities:
            // minutes,n,date|n|never
            // daily,n,date|n|never
            // weekly,n,thee-char-days-of-week-concatenated,date|n|never
            // monthly,n,two-char-days-of-month-concatenated,bool,date|n|never
            // trigger,n,date|n|never
            let repeat_values = temp_obj[i]['repeat'].split(',');
            /// handle tasks with no repeat
            if (repeat_values.length === 1) {
                // only draw tasks that exist within this month
                if (start_date_utc < month_first_moment || start_date_utc > month_last_moment) {
                    continue;
                }
                // skip if recordedTask already exists with same start/end date combo
                const rec_task_id = temp_obj[i]['_id'] + ',' + temp_obj[i]['dateStart'] + ',' + temp_obj[i]['dateEnd'];
                const found_rTask = get_recordedTask(rec_task_id, temp_obj[i]['recordedTasks']);
                if (found_rTask > -1) {
                    continue;
                }
                // write task
                let day_element = document.getElementById('month' + start_date_utc.getDate().toString());
                let temp_div = document.createElement('div');
                temp_div.id = temp_obj[i]['_id'] + ',' + temp_obj[i]['dateStart'] + ',' + temp_obj[i]['dateEnd'];
                temp_div.onclick = () => edit_task_popup(temp_div.id);
                temp_div.style.borderColor = '#' + temp_obj[i]['color'];
                temp_div.style.borderStyle = 'dotted';
                temp_div.innerText = temp_obj[i]['title'];
                day_element.append(temp_div);
                continue;
            }
            /// handle daily repeat
            if (repeat_values[0] === 'daily') {
                // console.log('repeat values: ', repeat_values);
                let is_n = is_all_digits(repeat_values[2]);// true if repeat n times
                let is_never = repeat_values[2] === 'never';// true if repeat never
                // set how many days to skip
                let skip_amt = parseInt(repeat_values[1]);
                // calculate final_date
                let final_date = null;
                let occurrences = 0;
                if (!is_never) {// set final_date as UTC
                    if (is_n) {// final_date calculated from start_date by n
                        occurrences = parseInt(repeat_values[2]);
                        final_date = new Date(start_date_utc);
                        final_date.setDate(final_date.getDate() + (skip_amt * occurrences));
                    }
                    else {// final_date explicitly defined
                        final_date = new Date(repeat_values[2] + 'Z');
                        // console.log('final_date explicitly defined: ', final_date);
                    }
                }// final_date.setDate(final_date.getDate() + (skip_amt * occurrences));
                // skip if task end date is before this month
                if (final_date && final_date < month_first_moment) {
                    continue;
                }
                // process n number of tasks in the series and print if in this month
                for (let ii = 0; is_never || final_date || ii < occurrences; ii++) {
                    // prep dates
                    let temp_start_date = new Date(start_date_utc);
                    temp_start_date.setDate(temp_start_date.getDate() + (skip_amt * ii));
                    // skip if past final_date
                    if (final_date && temp_start_date > final_date) {
                        // console.log('temp_start_date: ', temp_start_date);
                        break;
                    }
                    let temp_end_date = '';
                    if (end_date_utc) {
                        temp_end_date = new Date(end_date_utc);
                        temp_end_date.setDate(temp_end_date.getDate() + (skip_amt * ii));
                    }
                    // handle daylight savings time
                    const dst_end = getDSTEnd(start_date_utc.getFullYear());// LOCALIZED DATE
                    const dst_start = getDSTStart(start_date_utc.getFullYear());// LOCALIZED DATE
                    if (temp_start_date > dst_start && temp_start_date < dst_end) {
                        temp_start_date.setHours(temp_start_date.getHours() + 1);// add one hour
                        if (temp_end_date) {
                            temp_end_date.setHours(temp_end_date.getHours() + 1);
                        }
                    }
                    // convert temp_end_date to string as rec_task_id assignment requires it
                    if (temp_end_date) {
                        temp_end_date = temp_end_date.toISOString().slice(0, -5);
                    }
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
                    // skip drawing if in recordedTasks
                    const rec_task_id = temp_obj[i]['_id'] + ',' + temp_start_date.toISOString().slice(0, -5)
                        + ',' + temp_end_date;
                    const found_rTask = get_recordedTask(rec_task_id, temp_obj[i]['recordedTasks']);
                    if (found_rTask > -1) {
                        continue;
                    }
                    // time to draw
                    let month_day = temp_start_date.getDate();// should be local time?
                    let day_element = document.getElementById('month' + month_day.toString());
                    let temp_div = document.createElement('div');
                    temp_div.id = rec_task_id;
                    temp_div.onclick = () => edit_task_popup(temp_div.id);
                    temp_div.style.borderColor = '#' + temp_obj[i]['color'];
                    temp_div.style.borderStyle = 'dotted';
                    temp_div.innerText = temp_obj[i]['title'];
                    day_element.append(temp_div);
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

// RETURN -1 if not found or num of element
function get_recordedTask(recorded_task_id, rec_task_array) {
    try {
        // input validation
        if (!rec_task_array || rec_task_array.length === 0) {
            return -1;
        }
        for (let i = 0; i < rec_task_array.length; i++) {
            if (recorded_task_id === rec_task_array[i].id) {
                return i;
            }
        }
        return -1;
    } catch (error) {
        // Handle errors
        console.error("There was an error with get_recordedTask(): ", error);
    }
}

// RETURN day of week: 0..6 starting with Sunday
function get_weekday_of_month(month, year) {
    // Month is zero-based: January = 0, December = 11
    const firstDay = new Date(year, month, 1);
    return firstDay.getDay();
}

/// onclicks:
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

id_button_month_next.onclick=function () {
    set_cal_month_next(cal_now_month, cal_now_year);
    draw_month(cal_now_month, cal_now_year);
    // store view change
    const TASK_KEY = 'tasks';
    const SORT_KEY = 'calendar_view';
    const TASK_OBJ = {
        [TASK_KEY]: {
            [SORT_KEY]: id_calendar_view.dataset.view_config
        }
    };
    view_update(TASK_OBJ).catch(error =>
        console.error("Error in id_button_month_next.onclick:", error)
    );
}

id_button_month_now.onclick=function () {
    const now_date = new Date();
    draw_month(cal_now_month=now_date.getMonth(), cal_now_year=now_date.getFullYear());
    // set calendar_view dataset view
    id_calendar_view.dataset.view_config = cal_now_month.toString() + ',' + cal_now_year.toString();
    // store view change
    const TASK_KEY = 'tasks';
    const SORT_KEY = 'calendar_view';
    const TASK_OBJ = {
        [TASK_KEY]: {
            [SORT_KEY]: id_calendar_view.dataset.view_config
        }
    };
    view_update(TASK_OBJ).catch(error =>
        console.error("Error in id_button_month_now.onclick:", error)
    );
}

id_button_month_prev.onclick=function () {
    set_cal_month_prev(cal_now_month, cal_now_year);
    draw_month(cal_now_month, cal_now_year);
    // store view change
    const TASK_KEY = 'tasks';
    const SORT_KEY = 'calendar_view';
    const TASK_OBJ = {
        [TASK_KEY]: {
            [SORT_KEY]: id_calendar_view.dataset.view_config
        }
    };
    view_update(TASK_OBJ).catch(error =>
        console.error("Error in id_button_month_prev.onclick:", error)
    );
}

id_button_t_delete_submit.onclick=async function () {
    let id_form_id = document.getElementById('update_t_id');
    let id_form_dateend = document.getElementById('update_t_dateend');
    let id_form_datestart = document.getElementById('update_t_datestart');
    let id_form_guests = document.getElementById('update_t_guests');
    let id_form_intensity = document.getElementById('update_t_intensity');
    let id_form_location = document.getElementById('update_t_location');
    let id_form_status = document.getElementById('update_t_status');
    let id_form_tags = document.getElementById('update_t_tags');
    let id_form_note = document.getElementById('update_t_note');
    // INPUT VALIDATION
    let url = URL_BASE + '/t_delete/' + id_form_id.value;
    // make asynchronous POST request to the API
    let response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    // Parse the JSON data from the response
    let data = await response.json();
    if (data.statusCode != 200) {
        id_t_update_error_message.textContent = 'Error deleting recordedTask: non-200 response received...';
        id_t_update_error_message.style.display = 'flex';
        return;
    }
    close_popups();
    // blank out values
    id_form_dateend.value = '';
    id_form_datestart.value = '';
    id_form_guests.value = '';
    id_form_intensity.value = '';
    id_form_location.value = '';
    id_form_status.value = '';
    id_form_tags.value = '';
    id_form_note.value = '';
    get_tasks()
        .then(() => {
            draw_month(cal_now_month, cal_now_year);
        })
        .catch(error => console.error("Error in get_tasks:", error));
}

id_button_t_update_submit.onclick=async  function () {
    let id_form_id = document.getElementById('update_t_id');
    let id_form_dateend = document.getElementById('update_t_dateend');
    let id_form_datestart = document.getElementById('update_t_datestart');
    let id_form_guests = document.getElementById('update_t_guests');
    let id_form_intensity = document.getElementById('update_t_intensity');
    let id_form_location = document.getElementById('update_t_location');
    let id_form_status = document.getElementById('update_t_status');
    let id_form_tags = document.getElementById('update_t_tags');
    let id_form_note = document.getElementById('update_t_note');
    // INPUT VALIDATION
    // fix dates before populating object
    let date_end = null;
    let date_start = null;
    if (id_form_dateend.value !== "") {
        date_end = new Date(id_form_dateend.value).toISOString().slice(0, -5);
    }
    if (id_form_datestart.value !== "") {
        date_start = new Date(id_form_datestart.value).toISOString().slice(0, -5);
    }
    let recorded_task_obj = {
        'id': id_form_id.value,
        'dateEnd': date_end,
        'dateStart': date_start,
        'guests': id_form_guests.value,
        'intensity': id_form_intensity.value,
        'location': id_form_location.value,
        'note': id_form_note.value,
        'status': id_form_status.value,
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
        id_t_update_error_message.textContent = 'Error updating recordedTask: non-200 response received...';
        id_t_update_error_message.style.display = 'flex';
        return;
    }
    close_popups();
    // blank out values
    id_form_dateend.value = '';
    id_form_datestart.value = '';
    id_form_guests.value = '';
    id_form_intensity.value = '';
    id_form_location.value = '';
    id_form_status.value = '';
    id_form_tags.value = '';
    id_form_note.value = '';
    get_tasks()
        .then(() => {
            draw_month(cal_now_month, cal_now_year);
        })
        .catch(error => console.error("Error in get_tasks:", error));
}

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
            date_end = new Date(id_form_dateend.value).toISOString();
        }
        if (id_form_datestart.value === "") {
            date_start = null;
        }
        else {
            date_start = new Date(id_form_datestart.value).toISOString();
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
                draw_month(cal_now_month, cal_now_year);
            })
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
        // handle any dates in repeat
        let repeat_vals = convert_date_strings_to_local(id_form_repeat.value, false);
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
            'repeat': repeat_vals,
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
                draw_month(cal_now_month, cal_now_year);
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
        // store view change
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
            // re-assign cal_now_month, cal_now_year if calendar_view value set during view_apply
            if (id_calendar_view.dataset.view_config !== "") {
                let temp_array = id_calendar_view.dataset.view_config.split(',');
                if (temp_array.length === 2) {
                    cal_now_month = parseInt(temp_array[0]);
                    cal_now_year = parseInt(temp_array[1]);
                }
            }
            draw_month(cal_now_month, cal_now_year);
        })
        .catch(error => console.error("Error in view_configs_get:", error));
}
