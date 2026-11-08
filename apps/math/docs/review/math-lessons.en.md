# Math Academy — Integrals (review copy)

---

_This document is generated automatically from the site's YAML content, for specialist review. Any correction you send back gets applied to the YAML files (`src/content/lessons/*.yaml`), not to this document directly._

---

## Lesson 1 — How Much Area Is Under the Curve?

*Chapter 1 · building trust with rectangles*



Imagine a world where you can measure **any** area, even a curvy one with no simple formula. Sounds like magic — but it's really just one clever trick, and you're about to discover it yourself.

Let's start with something you already know. Here's the graph of `f(x) = x` from 0 to 6. It's a straight line, so the area underneath it is just a triangle — and you already know that formula: area = ½ × base × height = ½ × 6 × 6 = **18**.

Now for the big idea: cover that same area with **rectangles** — lots of thin ones, standing side by side. Play with the slider below and watch what happens as you add more of them.

Watch the estimate at the top of the chart. With just a few rectangles it's rough — but as you drag the slider toward more rectangles, it creeps closer and closer to the **18** you already calculated by hand. That's not a coincidence: it's the whole idea behind an **integral**.

So here's the real challenge. What if the curve **isn't** a straight line — what if it's a parabola, with no triangle formula to fall back on? Let's try `f(x) = x²` from 0 to 4. The exact same rectangle trick still works — except this time, we have no shortcut to check the answer against. _Yet._

Push the rectangle count as high as it goes and note the number you land on — you'll need it in the next lesson, when we give that shortcut a name.



> 🖩 *Interactive explorer:* `f(x) = x` on [0, 6] — Check it: a straight line, area already known (18)

> 🖩 *Interactive explorer:* `f(x) = x²` on [0, 4] — The challenge: a curve with no simple formula



**Key points**

- The area under a curve can be estimated by covering it with thin rectangles.

- More (and thinner) rectangles make the estimate more accurate.

- A straight line has a simple area formula (a triangle); most curves don't — but the rectangle trick works on both.



**Practice questions (with correct answers and explanations, for review)**

1. **Why do we use rectangles to estimate the area under a curve, instead of a triangle formula?**
   - (a) Because rectangles are easier to draw.
   - (b) Because most curves aren't straight lines, so there's no simple shape formula for them — but rectangles can approximate any shape. ✅
   - (c) Because triangles only work for small areas.
   - _Explanation:_ A triangle (or any simple shape formula) only works when the boundary is straight. Rectangles don't care about the shape of the curve — stack enough thin ones and they approximate any area, which is exactly why this trick generalizes.

2. **What happens to the estimate as you use more (thinner) rectangles?**
   - (a) It gets less accurate.
   - (b) It stays exactly the same.
   - (c) It gets closer to the true area. ✅
   - _Explanation:_ Thinner rectangles leave less of a gap between the rectangle tops and the actual curve, so the total estimate converges toward the true area.

3. **Using the triangle formula, what is the exact area under f(x) = x from 0 to 6?**
   - Correct value: **18** (± 0.1)
   - _Explanation:_ Area = ½ × base × height = ½ × 6 × 6 = 18 — the same number the rectangles should have converged to.

---

## Lesson 2 — Riemann Sums: More Rectangles, Better Guess

*Chapter 2 · from guess to definition*



Last lesson you pushed the rectangle count as high as it goes for `f(x) = x²` on 0–4, and watched the estimate settle somewhere around **21.3**. Today we give that number — and the method that found it — an actual name.

There's more than one way to build a rectangle out of a slice of the x-axis, and the choice matters. A **left-endpoint** sum uses the height of the curve at the _left_ edge of each slice. A **right-endpoint** sum uses the _right_ edge. A **midpoint** sum uses the point in between.

Flip between the three modes below, on the same curve. Because `f(x) = x²` is increasing, the left-endpoint sum always lands **under** the curve, the right-endpoint sum always overshoots **above** it — and the midpoint sum, splitting the difference, usually lands closest.

No matter which mode you pick, something remarkable happens as you drag toward more rectangles: all three numbers converge to the **same** value. That shared limit — the exact area, once the rectangles become infinitely thin — is what mathematicians call the **definite integral**, written `∫₀⁴ x² dx`.

Read that notation as: "the exact area under `f(x) = x²`, between 0 and 4." The elongated **∫** symbol is literally a stretched **S** — short for _sum_ — because that's exactly what it is: the limit of a sum of rectangles.



> 🖩 *Interactive explorer:* `f(x) = x²` on [0, 4] — Compare left, right and midpoint sums on the same curve



**Key points**

- For an increasing curve, the left-endpoint sum underestimates the true area and the right-endpoint sum overestimates it.

- The midpoint sum splits the difference and is usually the closest of the three.

- As the number of rectangles grows without bound, all three sums converge to the same number — the definite integral, written ∫ₐᵇ f(x) dx.



**Practice questions (with correct answers and explanations, for review)**

1. **For an increasing function like f(x) = x², which sum always overestimates the true area?**
   - (a) The left-endpoint sum
   - (b) The right-endpoint sum ✅
   - (c) The midpoint sum
   - _Explanation:_ Each rectangle's height comes from the curve's highest point in that slice (the right edge, since the function is increasing), so every rectangle sits a little above the curve — the total always overshoots.

2. **What does the notation ∫₀⁴ f(x) dx actually mean?**
   - (a) The slope of f(x) at x = 4
   - (b) The exact area under f(x) between x = 0 and x = 4 — the limit of the rectangle sums as they get infinitely thin ✅
   - (c) The single highest value f(x) reaches between 0 and 4
   - _Explanation:_ The ∫ symbol is shorthand for exactly the process you just watched converge — stack infinitely many, infinitely thin rectangles between the two bounds, and add them up.

3. **Using n = 4 midpoint rectangles for f(x) = x² on [0, 4] (each 1 wide, midpoints at x = 0.5, 1.5, 2.5, 3.5), what is the midpoint sum?**
   - Correct value: **21** (± 0.5)
   - _Explanation:_ f(0.5)² + f(1.5)² + f(2.5)² + f(3.5)² = 0.25 + 2.25 + 6.25 + 12.25 = 21, each times a width of 1 — already close to the exact 21.33.

---

## Lesson 3 — The Magic Shortcut: The Antiderivative

*Chapter 3 · the formula reveals itself*



Dragging a slider toward infinitely many rectangles works, but it's slow — and it only gives you a decimal, never an exact fraction. Mathematicians found a shortcut: a single formula that jumps straight to the answer, with no slider required.

Here's the pattern, for any power `xⁿ`: `∫₀ᵇ xⁿ dx = bⁿ⁺¹ / (n+1)`. Raise the power by one, divide by the new power. That's it — that's the whole trick.

Don't believe a formula until it agrees with something you already trust. Lesson 1: `n = 1, b = 6`, so the shortcut gives `6² / 2 = 18` — exactly the triangle area you calculated by hand. Lesson 2: `n = 2, b = 4`, so the shortcut gives `4³ / 3 ≈ 21.33` — exactly where your rectangles were heading. The shortcut isn't a new answer. It's the same answer, instantly.

When the area starts at some point `a` other than 0, just subtract: `∫ₐᵇ xⁿ dx = bⁿ⁺¹/(n+1) − aⁿ⁺¹/(n+1)`. (Advanced note, safe to skip: this shortcut works because `F(x) = xⁿ⁺¹/(n+1)` is an **antiderivative** of `xⁿ` — a function that "undoes" into `xⁿ` — and any two antiderivatives of the same function only ever differ by a constant, which cancels out the moment you subtract one bound from the other.)

Time to test it on a function you haven't seen yet: `f(x) = x³` from 0 to 2. The shortcut predicts `2⁴ / 4 = 4`. Drag the explorer below toward more rectangles and see for yourself whether it lands there.



> 🖩 *Interactive explorer:* `f(x) = x³` on [0, 2] — Put the shortcut to the test on a brand-new curve



**Key points**

- The power-rule shortcut: ∫₀ᵇ xⁿ dx = bⁿ⁺¹ / (n+1). For a lower bound a ≠ 0, subtract the formula evaluated at a.

- The shortcut gives the exact same value the rectangles were converging toward — it's a formula for the limit, not a different number.

- A function whose derivative is f is called an antiderivative of f; the Fundamental Theorem of Calculus is what connects antiderivatives back to the area-under-the-curve problem.



**Practice questions (with correct answers and explanations, for review)**

1. **Using the shortcut, what is ∫₀³ x² dx?**
   - Correct value: **9** (± 0.05)
   - _Explanation:_ n = 2, b = 3: 3³ / 3 = 27 / 3 = 9.

2. **Using the shortcut, what is ∫₁² x³ dx?**
   - Correct value: **3.75** (± 0.05)
   - _Explanation:_ n = 3: 2⁴/4 − 1⁴/4 = 16/4 − 1/4 = 4 − 0.25 = 3.75.

3. **What is an antiderivative of f, in plain words?**
   - (a) A function that, when you take its derivative, gives you back f ✅
   - (b) A function that is always smaller than f
   - (c) The graph of f flipped upside down
   - _Explanation:_ "Anti"-derivative literally means the reverse of a derivative: F is an antiderivative of f when F′ = f. That reversal is exactly what links the power-rule shortcut back to the rectangle-sum area problem.