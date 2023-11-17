const isPrime = (n) =>
  !Array(Math.ceil(Math.sqrt(n)))
    .fill(0)
    .map((_, i) => i + 2) // first prime is 2
    .some((i) => n !== i && n % i === 0);

const primesCache = [2];
const p = (i) => {
  if (primesCache.length <= i) {
    let x = primesCache.at(-1);
    while (primesCache.length <= i) {
      if (isPrime(++x)) primesCache.push(x);
    }
  }
  return primesCache.at(i - 1);
};

const computeGodelNumber = (godelSequence) =>
  godelSequence.reduce((acc, num, i) => {
    const prime = p(i + 1);
    return BigInt(acc) * BigInt(prime) ** BigInt(num);
  }, 1) - BigInt(1);

self.addEventListener("message", (e) => {
  const godelNumber = computeGodelNumber(e.data);
  postMessage(godelNumber);
});
