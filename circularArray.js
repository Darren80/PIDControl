class CircularArray {
    constructor(size) {
        this.buffer = new Array(size);
        this.size = size;
        this.start = 0;  // Track start of the array
        this.end = 0;  // Track end of the array
    }

    // Add an element to the array
    enqueue(element) {
        this.buffer[this.end] = element;
        this.end = (this.end + 1) % this.size;

        // If we've gone around the buffer, increment the start so we overwrite old data
        if (this.end === this.start) {
            this.start = (this.start + 1) % this.size;
        }
    }

    // Remove an element from the array
    dequeue() {
        if (this.isEmpty()) {
            throw "Circular Buffer is empty";
        }
        let element = this.buffer[this.start];
        this.buffer[this.start] = null; // Clear out optional, helps with garbage collection
        this.start = (this.start + 1) % this.size;
        return element;
    }

    // Check if the array is empty
    isEmpty() {
        return this.start === this.end && !this.buffer[this.start];
    }

    // Check if the array is full
    isFull() {
        return this.start === this.end && !!this.buffer[this.start];
    }

    // Peek at the first element
    peek() {
        if (this.isEmpty()) {
            throw "Circular Buffer is empty";
        }
        return this.buffer[this.start];
    }
}
