let proportionalErrorDataPointer = 0;
let proportionalErrorDataSize = 100;
this.proportionalErrorData = [];
// Create an array of 100 elements initialized to 0
for (let i = 0; i < 100; i++) {
    this.proportionalErrorData.push(0);
}

function run() {
    this.proportionalErrorData[proportionalErrorDataPointer](this.proportionalTerm); // Big O(1)
    this.proportionalErrorDataPointer++; // Big O(1)
    if (proportionalErrorDataPointer === proportionalErrorDataSize) {
        this.proportionalErrorDataPointer = 0; // Big O(1)
    }
    // Big O(1) + Big O(1) = Big O(2) = Big O(1)
}