# Project Reflection

One challenge in this project was deciding how to handle a task that passes its deadline while the page is closed. I solved this by checking every task when the app loads and whenever it renders, then saving any status changes. I also made completed tasks exempt from the overdue rule so finishing a late task does not erase its completed status. Another challenge was keeping the summary counts, category filter, and visible task list consistent after each action. I organized those updates into small rendering functions and used event delegation for task status changes and deletion.

If I had more time, I would add task editing, optional notes, and a way to export or back up tasks. I would also add automated browser tests and let users choose a reminder before a deadline. At the moment, data is stored only in the current browser, so it does not sync across devices.
