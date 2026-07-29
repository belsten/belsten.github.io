---
title: "Emergence of unique hues from sparse coding of color in natural images"
excerpt: ""
date: 2026-07-28
categories:
  - blog
tags:
  - minimal-mistakes
  - Jekyll
  - update
---

<!-- # excerpt: "Breaking down our recent paper on the statistics of color in natural images and sparse coding." -->
In this blog post, I hope to communicate what our recent paper brings to color science. 

The paper makes two main contributions. First, we show that the distribution of colors in natural images is highly non-Gaussian (we'll see what that means shortly). Second, we show that when a sparse coding model is adapted to this statistical structure, it learns basis vectors that align with the unique hues.

I will try to keep the specific details of color to a minimum, as color can get quite technical at times. Of course, the details are in the paper. There are also many excellent resources on color vision, including Brian Wandell’s Foundations of Vision.

Sparse coding also comes with it's own jargon and complexities. Here, I hope to shed some of that, as applying this method to a low dimensional color lends its self to an intuitive geometric understanding of what this model is doing. 

Lets begin with some history.

---

# What are the unique hues?

Why do red, green, blue, and yellow seem more “pure” than other colors? 

For example, while the color purple might naturally be described as a combination of red and blue, it seems somewhat less intuitive to think of red as a combination of orange and purple, even though a mixture of those colors would produce red just as well as red + yellow produce orange. In other words, we tend to think of red as just red - not as a mixture.  This same unique property holds for green, blue, and yellow: each appears perceptually pure rather than as a mixture of neighboring hues.

<!-- <figure style="text-align: center;">
  <img src="../../assets/unique-hues/color_mix_venn_both.png" width="100%" alt="Inference with three basis vectors" />
  <figcaption><strong>Figure 1</strong>: It is natural to think of purple as a combination of red and blue. Conversely, it is less natural to think of red as a combination of purple and orange.</figcaption>
</figure> -->

This phenomenon was first described and extensively documented in the late 19th century by the German physiologist Ewald Hering, who dubbed these unique colors the *Urfarben*. He proposed they serve as a perceptual basis for describing all other colors, and moreover, that certain pairs of these colors -- red/green and blue/yellow -- appear opposites in that they are never used simultaneously to describe any color. That is, just as one would never say you are traveling in an east-west or north-south direction, it would be just as nonsensical to describe a color as appearing reddish-green or bluish-yellow.  

<figure style="text-align: center;">
  <img src="../../assets/unique-hues/herings_urfarben.jpg" width="80%" alt="Urfarben" />
<figcaption><strong>Figure 1</strong>: Diagram of Hering's <i>Urfarben</i> published in his 1878 book. The top panel shows how different ratios of the unqiue hues combine to make the various hues shown on the bottom panel. Mutually exclusive unique hues–red/green and blue/yellow–are opposite to one another.</figcaption>
</figure>

More than a century later, the unique hues and their opponent nature still serve as the accepted basis for describing color appearance, yet their special status remains a mystery.  No known property of light, the cone photoreceptors in the eye, or neural representations in the brain can explain why these four hues, rather than some other set, should occupy this privileged position (Conway *et al.*, 2023; Mollon & Jordan, 1997). 

Our study suggests the answer to the perceptual mystery lies in the distribution of colors present in the natural world. By simulating how each of the three types of human cone photoreceptors respond to hundreds of millions of points sampled from natural scenes, obtained from publicly available datasets of calibrated color images acquired from diverse locations around the world, we find that the distribution of colors is highly nonuniform. Most pixels are relatively achromatic (colorless), while highly saturated colors are rarer. But those rare colors are not spread equally in every direction: some occur with greater saturation consistently more often than others. To characterize this structure in the distribution, we fit a sparse coding model to the data which learns a set of basis vectors that would optimally span this space in order to form a sparse representation. When the sparse coding model is given four basis vectors to describe hue, they align with the unqiue hues -- red, green, blue, and yellow. Moreover, the opponent nature of red-green and blue-yellow also emerges from the model since these vectors are never used in combination to describe any other color, exactly as proposed by Hering more than a century ago. Together, these findings shed new light on the distribution of color in the natural environment and provide a linking principle between this structure and the phenomenology of color appearance. 

# A color basis

Hering was, in effect, descirbing the unique hues as a natural basis for reasoning about colors. This idea can be formalized using the mathematical concept of a basis: a collection of elementary directions that can be combined to represent other points in a space.

For example, a hue can be represented as a vector pointing in a particular direction in color space. A color $\mathbf{x}$ can be reconstructed through a superposition of $m$ basis vectors $\mathbf{a}_i$ weighted by coefficients $s_i$,

$$\mathbf{x} = \sum_{i=1}^m \mathbf{a}_i\, s_i.$$

The basis vectors specify the available elementary color directions, while the coefficients specify how much of each direction is used to represent a particular color. 

To keep the geometry simple, lets assume that changes in luminance have been accounted for, so only variation in hue needs to be considered. In the paper, we consider a full 3D color space that includes luminance, but we can make the major points by just considering hue. Thus, both the colors being represented and the basis vectors live in a two-dimensional chromatic plane.

A nominal arangement that  spans this 2D-space is three basis vectors seperated by 120${}^\circ$, forming a Mercedez-Benz frame. Such a basis is shown in Figure 2. 

Given this basis, how should we choose the coefficients to represent a particular color? We use a **constructive** representation, meaning that the coefficients must be nonnegative: colors are represented by adding basis directions rather than subtracting them. We also favor **sparse** reconstructions, which favors using only a small number of basis vectors out the larger dictionary to reconstruct the data point. 

The process of finding these nonnegative, sparse coefficients is called **sparse inference** (or inference for short). Sparse inference jointly adjusts the coefficients until the weighted basis vectors accurately reconstruct the target color while keeping the total coefficient activity small. This process requires an joint optimization because, in general, the basis vectors are not orthogonal so changing one coefficient changes the residual that the others must explain. Thus, an interative algorithm that repeatedly adjusts the coefficients until an accurate reconstruction is found is needed. 

The animation in Figure 2 shows the process of inference for three colors using the Mercedez-Benz frame:

<figure style="text-align: center;">
  <img src="../../assets/unique-hues/lca_example.gif" width="100%" alt="Inference with three basis vectors" />
  <figcaption><strong>Figure 2</strong>: Sparse inference using a three-vector Mercedes-Benz frame. The light vectors show the basis vectors, and the point marks the target color. Starting from zero, inference adjusts the coefficients, producing the bold weighted vectors whose sum reconstructs the target.</figcaption>
</figure>

Each basis vector is rescaled by its corresponding coefficient; geometrically placing the scaled vectors end to end shows how their sum reaches the target color. Because the basis vectors have unit length, the sum of the coefficients is also the total path length traced by the scaled vectors. Sparse inference favors a short path to the target. In this two-dimensional example, at most two basis vectors are sufficient to represent any color, and only one is needed when the target lies directly along a basis direction.

With this geometric view, we can see how activating all three vectors would introduce unnecessary backtracking. Since $\mathbf{x}$ is 2-dimensional, the minimum-path representation uses no more than two active ceofficients. This is not unique to the Mercedez-Benz frame or even having three basis vectors. Given a basis of size $m>n+1$ that spans an $n$-dimensional space under nonnegative weightings, only $n$ nonzero ceofficeints are needed to represent a point in that space. 

The statistical model we're describing is called **sparse coding**. Sparse coding assumes the data can be represented using sparse coefficients on a collection of basis vectors (Olshausen & Field, 1996). The mathematical details of sparse coding and sparse inference is described below. Readers interested primarily in the main argument can skip this box.

<div class="notice--info" markdown="1">
**Mathematical details: sparse coding inference**

While reconstructing a data point from the coefficients is linear $\mathbf{x} = \sum_i {a}_i\,s_i$, computing the coefficients $s_1,s_2,...,s_m$ given a datapoint $\mathbf{x}$ is a nonlinear.  For a given $\mathbf{x}$, the $s_i$ are computed by minimizing an sparse coding energy function $E$ subject to a nonnegativity constraint:

$$
\begin{align}
  \min_{\{s_i\}_{i=1}^m} & \quad E = \frac{1}{2}\Big\lVert\mathbf{x} - \sum_{i=1}^m\mathbf{a}_i{s}_i\Big\rVert_2^2\; +\; \lambda \sum_{i=1}^m s_i \label{eqn:energy} \\
\text{subject to} & \quad s_i \geq 0 \quad\text{for} \ i = 1,2,...,m.
\end{align}
$$

The first term in this energy function says that the coefficients should reconstruct the data point and the second term is a $\ell_1$-sparsity inducing penalty that encourages using only a small number of basis vectors out a larger dictionary. The parameter $\lambda$ controls the trade-off between reconstruction quality and sparsity. 

Given a set of basis vectors, the above optimization problem can be solved using a nonnegative variant of locally competative algorithm (Rozell *et al.*, 2008). 
LCA evolves subthreshold variables $u_i$ whose thresholded outputs $s_i$ are the coefficients:

$$
 \begin{align}
  \tau \dot{u}_i + u_i &= \mathbf{a}_i^T\mathbf{x} - \sum_{j\neq i}\mathbf{G}_{ij} s_j \\
  s_i &= \max(0, u_i-\lambda) = g(u_i)
\end{align}
$$

where $ \mathbf{G}_{ij} = \mathbf{a}_i^T\mathbf{a}_j$. The rectifying nonlinearity $g(\cdot)$ enforces the $\ell_1$-sparsity penalty on the coefficients while imposing an infinite energy barrier at $s_i<0$, satisfying the nonnegativity constraint. Letting the dynamics above settle to an equalibrim yields the nonnegative coefficients that minimize $E$. 

We refer to the process of computing the coefficients as infernece because it is actually performing maximum-a-posteriori (MAP) Bayesian inference (for details see Olshausen & Field, 1997).

</div>

So far, we have fixed the basis to a Mercedes-Benz frame. But this choice is arbitrary: infinitely many other arrangements could also represent every hue. To choose among them, we need an additional principle. One possibility is that the visual system adapts its representation to the colors it repeatedly encounters, favoring basis vectors that efficiently capture the statistical structure of the natural environment. Color perception has long been proposed to reflect such environmental statistics (e.g., Mollon & Jordan, 1997; Shepard, 1992; Skelton et al., 2024). Could this adaptation explain the unique hues?

# The distribution of color in natural images is highly non-Gaussian

To measure the distribution of color in the natural environment, we combined publicly available datasets of calibrated color images acquired from diverse locations around the world. Figure 3 shows a few examples from the dataset. 

<figure style="text-align: center;">
  <img src="../../assets/unique-hues/montage_blog.jpeg" width="80%" alt="Subset of natural images in dataset" />
  <figcaption><strong>Figure 3</strong>: Subset of images in dataset.</figcaption>
</figure>

The dataset contains 503 images of flora, forests, landscapes, seascapes, and geological formations, yielding more than 225 million pixels. We excluded scenes containing human-made objects because their colors may reflect human perceptual and design preferences and thus could inherit the very biases in human color perception that we seek to study.

Want to understand how color is distributed in this dataset. 225 million datapoints is far to many to put in a scatter plot. Instead, we compute a histogram of the colors and then summarize this histogram using iso-probability contours, as shown in the below:

<figure style="text-align: center;">
  <img src="../../assets/unique-hues/fig3_stats_vert_equal_bins_blog.png" style="width: 80%; display: block; margin: 0 auto;" alt="Distribution of hues in natural images" />
  <figcaption><strong>Figure 4</strong>: Distribution of hues in natural images. Dashed contours indicate isoprobability contours for an isotropic Gaussian distribution with the same variance as the data distribution. The contours are equally spaced in log-probability, using the same color scale for both solid and dashed contours. </figcaption>
</figure>

In the plot above, we have computed the chromatic axes such that the data have unit variance in every direction  (Ruderman *et al.*, 1998). This makes an isotropic Gaussian with identical variance a useful reference. The contours from this distribution are overlaid in dashed lines. Importantly, if the distribution were Gaussian the solid contours would follow the dashed contours exactly, but this is not the case. Comparing the isoprobability contours of the natural image distribution to those of the Gaussian reveals pronounced asymmetries and substantial deviations from Gaussianity.

The natural image distribution is peaked around the origin meaning that most pixels are relatively achromatic (colorless), while highly saturated colors are rarer. However, the rare colors are not distributed equally across hue directions. In some special directions--most notably toward red--the contours extend much farther from the origin than the Gaussian prediction, revealing heavy tails. The distribution is also asymmetric: hue directions that are opposite to one another in the space do not necessarily have the same shape. We find that this strucutre is generally persistent across heterogeneous datasets.

These  heavy tails and asymmetries are examples of **higher-order statistical structure** which can not be characterized using pair-wise correlations (Simoncelli & Olshausen, 2001). We think that this higher-order structure has implications for how the brain represents color. 

The idea that the brain is adapted to higher-order statistics in sensory input is not a new one. For example, David Field (1994) showed corresponance between the higher-order statistical structure of natural image patches and orientation selective spatial receptive properties of simple-cells in visual cortex (which eventually lead to the development of the sparse coding model). There is also correspondence between auditory nerve fiber tuning properties and the statistcal structure of environmental sounds and vocalizations (Lewicki, 2002). 

# Adapting the basis to model non-Gaussian structure 

Given the non-Gaussian structure in the natural images, some basis vector directions will be preferable under the sparsity assumption. Therefore, we now turn to **learning**: adapting the basis vectors themselves to the distribution of colors in natural scenes. 

When the basis is adapted to the structure in the data, the puzzle the model is solving is how to place these vectors in the space such that there is a maximizally sparse nonnegative code is produced in the coefficeints when averaged over the entire dataset. Doing so favors learning basis vectors that align with the directions in the data which occur rarely but with high magnitude, i.e., the heavy-tailed directions. Thus, the model learns a concise and efficient way to represent color, and the higher-order statistical structure of natural colors. 

The mathematical details of the learning rule are given below. This box can be skipped without disrupting the main argument.

<div class="notice--info" markdown="1">
**Mathematical details: learning the sparse coding basis vectors**

The basis vectors $\mathbf{a}_i$ are adapted to the structure of the data by stochasitc gradient descent on $E$, using the inferred coefficients $s_i$ for each data sample $\mathbf{x}$. This yields the following learning rule:

$$
\begin{align}
  \Delta \mathbf{a}_i = \eta \left[ \mathbf{x} - \sum_{j=1}^m \mathbf{a}_j s_j \right] s_i.
\end{align}
$$

The update rate $\eta$ is set small so that the energy decreases continuously until convergence.
After each update, the basis vectors are normalized to have unit norm: $\lVert\mathbf{a}_i\rVert_2 =1 \text{ for all } i$. 

</div>

The animation below shows this learning process for a model with three basis vectors. Each panel begins from a different random initialization.

<figure style="text-align: center;">
  <img src="../../assets/unique-hues/training_grid_3_9.gif" width="100%" alt="Three basis vectors training animation" />
  <figcaption><strong>Figure 5</strong>: Learning in models with three basis vectors. Each panel begins from a different random initialization, yet the vectors converge toward the same three heavy-tailed directions in the data. The inner circle has unit radius, and the gray curve reproduces $\log_{10}\text{probability}=-4$ contour from Figure 4.</figcaption>
</figure>

Despite their different starting points, the models converge to the same general arrangement: the three basis vectors that correspond to blue, red, and green-yellow. 
This placement is expected as the data exhibits a heavy-tailed extension in these directions as indicated by the iso-probability contour in Figure 5. 

Figure 4 shows that three basis vectors learns to be aligned. All models learn the same representation that point in the directions of the heavy-tails. Under the sparsity constraint, at most two basis vectors will be used at a time to reconstruct a data point. This means that if any two basis vector coefficients are active, then the other one must be equal to zero. 

But three vectors are only one possible choice. What happens when the model is given a fourth? Learning four basis vectors is shown in the animation below. 

<figure style="text-align: center;">
  <img src="../../assets/unique-hues/training_grid_4_9.gif" width="100%" alt="Four basis vectors training animation" />
  <figcaption><strong>Figure 6</strong>: Learning in models with four basis vectors. Each panel begins from a different random initialization, yet the learned vectors converge toward directions corresponding approximately to red, green, blue, and yellow.</figcaption>
</figure>

Compared with the three-vector solution, the red vector remains relatively stable. Adding a fourth vector splits the broad blue–green region: a new vector settles near green, while the neighboring vectors shift toward blue and yellow. The resulting arrangement aligns approximately with red, green, blue, and yellow. 

Human measurements suggest that the unique hues are not orthogonal to one another and thus opponent pairs such as red–green and blue–yellow are not diametrically opposite in a geometric color plane. The learned basis reproduces these qualitative attributes.

## Emergence of color opponency

A puzzling aspect of the unique hues is that opponent hues are not geometrically opposite to one another in physiologically defined color spaces--that is, spaces based on cone responses and early visual processing. Why, then, are red and green perceived as opposites, and likewise blue and yellow? Also, what mathematical principles could reproduce such an opponent organization?

Recall that sparse inference will only use at most two basis vectors at a time to represent a point in the two-dimensional color space. We find that this naturally gives rise to mutually exclusivitiy between basis vector coefficients that that represent phenominolically opposing colors (red/green and blue/yellow). Figure 7 demonstrates this. The left side of the plot shows how the point is reconstructed by combing the weighted basis vector end-to-end and the right side shows the ceoffcient magnitude. 

<figure style="text-align: center;">
  <img src="../../assets/unique-hues/4_basis_inference.gif" width="100%" alt="Four basis vectors training animation" />
  <figcaption><strong>Figure 7</strong>: Sparse inference using the learned four-vector basis. The light vectors show the basis directions, and the black point marks a target color moving around the hue circle. The bold vectors show the inferred weighted basis vectors whose sum reconstructs the target. Their coefficients are plotted at right.</figcaption>
</figure>

As the target moves around the hue circle, neighboring basis vectors can be active together to represent intermediate hues. By contrast, red and green are never coactive, nor are blue and yellow. This opposition was not imposed on the model but emerges from sparse inference.

<figure style="text-align: center;">
  <img src="../../assets/unique-hues/nonlin-inference.pdf" width="100%" alt="Four basis vectors training animation" />
  <figcaption><strong>Figure 8</strong>: Sparse inference with the four learned nonorthogonal basis vectors in the data $\mathbf{x}$ space (left) allows for the construction of a perceputally parsiomenious color space where the orthogonal axes are the activations of sparse coefficients that represent the unique hues. Two example points show how intermidate hues (purple and greenish) map from the data space to the color opponent space defined by the coefficients.</figcaption>
</figure>

Although the learned basis vectors are not geometrically opposite in the original color space, their inferred coefficients can be reorganized into two signed opponent axes as shown in Figure 8. Red and green occupy opposite ends of one axis, while blue and yellow occupy opposite ends of the other. This two-dimensional opponent space captures the phenomenological organization of color experience.

You might be wondering: *why favor four basis vectors over three?* Both models can represent any point in the color plane and thus form a complete code. You might argue that the three basis vector model is better aligned with the heavy-tails in the data. A distinction between them lies in the structure of the resulting sparse code. In the three-vector model, the coefficients exhibit a three-way dependency: when two are active, the third is silent. In the four-vector model, this dependency separates into two mutually exclusive pairs: red versus green and blue versus yellow. This points to a trade off between being perfectly aligned with the data and a simple, distributed code. 

# Conclusion

The two main contributions of this paper are (1) the finding of strongly non-Gaussian structure of color in a large database of natural images, and (2) showing that a constructive linear generative model adapted to this data aligns with the unique hues. Sparse coding inference introduces mutual exclusivity between coefficients and yields a color representation that mirrors the phenomenology of color perception. It is remarkable that not only unique hues but also the structure of their interactions arises from fitting a single linear generative model, with few other assumptions, to the data.

# References 
Conway, B. R., Malik-Moraleda, S., & Gibson, E. (2023). Color appearance and the end of Hering’s Opponent-Colors Theory. Trends in Cognitive Sciences, 27(9), 791-804.

Field, D. J. (1994). What is the goal of sensory coding?. Neural computation, 6(4), 559-601.


Lewicki, M. S. (2002). Efficient coding of natural sounds. Nature neuroscience, 5(4), 356-363.


Mollon, J. D., & Jordan, G. (1997). On the nature of unique hues. John Dalton’s colour vision legacy, 381-392.

Olshausen, B. A., & Field, D. J. (1996). Emergence of simple-cell receptive field properties by learning a sparse code for natural images. Nature, 381(6583), 607-609.


Olshausen, B. A., & Field, D. J. (1997). Sparse coding with an overcomplete basis set: A strategy employed by V1?. Vision research, 37(23), 3311-3325.

Rozell, C. J., Johnson, D. H., Baraniuk, R. G., & Olshausen, B. A. (2008). Sparse coding via thresholding and local competition in neural circuits. Neural computation, 20(10), 2526-2563.

Ruderman, D. L., Cronin, T. W., & Chiao, C. C. (1998). Statistics of cone responses to natural images: implications for visual coding. Journal of the Optical Society of America A, 15(8), 2036-2045.


Shepard, R. N. (1992). The perceptual organization of colors: an adaptation to regularities of the terrestrial world?.


Simoncelli, E. P., & Olshausen, B. A. (2001). Natural image statistics and neural representation. Annual review of neuroscience, 24(1), 1193-1216.

Skelton, A. E., Maule, J., Floyd, S., Wozniak, B., Majid, A., Bosten, J. M., & Franklin, A. (2024). Effects of visual diet on colour discrimination and preference. Proceedings of the Royal Society B: Biological Sciences, 291(2031), 20240909.

 <!-- suffices to describe all of color space, why favor four. You might argue that the three basis vector model is well aligned with the three heavy tailed directions in the data.
Basis vectors are less strongly aligned with heavy-tailed directions in the data. 
The sparse code for the three basis vector model contains complex redudancies. If two coefficeints are on then the other one is off. The four basis vector model has redudencies that are more natural to think about. two are opponent. If one coefficinet is on, then the other one is off. For this model, the redundencies are simpler and more explicit. This points to a trade off  between being perfectly aligned with heavy-tails and a distributed code.  -->

<!-- David Field talks about sparse coding as making higher-order statistical redundencies explicit.  -->
<!-- The sparsity penalty causes only two basis vectors to be active. The two that are active depends on the subspace the point is in. thus only enighboring basis vector coefficients will be co active. This is evident in the bar plot. Only two coefficents tare used at at time. The model also reproduces this mutually exclusivity: it does not use red and green basis vectors together, nor blue and yellow. -->
<!-- 
Additionally, the coefficents exceed a vlaue of 1 to describe certain points, despite those points lying at unit radius. This is a result of a facilatoaty effect in sparse coding inference which recruits basis vectors to describe a point, despite that point having a negative projectino on the basis vector.  
-->

<!-- 
outline

* Combining colors. Simple color tutorial. color mixing. 
* Add energy function. No one shot computation that can compute basis. Has to be done cooperatively.
* [GIF] how that can be used to descripe a point in the space. 
* Note that any basis will do to descibe all points. 
* [PLOT] plot distbution of colors an a few example images. Color distribution doesn't fill the space uniformly. Suggests that there are special directions. Sparsity, and heavy tails. 
* [GIF_DONE]Show three basis vectors learns to be aligned. All models learn the same prepresentaion. However, there are complex redudancies. If two are on then the other is off. 
* [GIF_DONE] Bring in four basis vectors. Heres what happens when you adapt four to the distribution. Trade-off between perfectly aligned with heavy-tails and a distributed code. 
* [GIF] L1 cost says to only use two at a time. This leads to mutual exclusivity.  Given the mutual exclusivity, the coefficients construct a parsimonious color space 
* Now redudencies arenatural to think about four -- two are opponent. Redundencies are similar and more explicit. 

* Combining colors. Simple color tutorial. color mixing. 
* A set of bases for color appearance? What does that even mean. 
* Color plane
* nominal arangement is three basis. Nonnegative, motivated by a constructive representation. Another nonnegative represetnation is the cardinal directions. Could just have north, negative north, east, and negative east. But instead we use north, south, east, and west. 
* Add energy function. 
* [GIF] how that can be used to descripe a point in the space. 
* Note that any basis will do to descibe all points. 
* [PLOT] plot distbution of colors an a few example images. Color distribution doesn't fill the space uniformly. Suggests that there are special directions. Sparsity, and heavy tails. 
* [GIF_DONE]Show three basis vectors learns to be aligned. All models learn the same prepresentaion. However, there are complex redudancies. If two are on then the other is off. 
* [GIF_DONE] 
* [GIF]  
-->


<!-- and the resulting vectors are placed end to end. Their sum reaches the color being represented. -->
<!-- Here, the coefficients are constrained to be nonnegative. This makes the representation constructive: colors are described by adding elementary directions rather than subtracting them. The cardinal directions provide a familiar analogy. We use a constructive representation of four vectors--north, south, east, and west--to describe 2-D space. By contrast, if we used signed coefficients to descibe space, only two vectors would be necessary. For example, negative north would represent south, and negative east represents west. -->
<!-- 
Above shows how three points could be reconstructed using the mercedez-benz frame basis. 
The datapoints $\mathbf{x}$ are represented by rescaling each basis by it's corresponding coefficient value and by combining the vectors end to end.
Here, the coefficients are constrained to be nonnegative which produces a constructive representation. Another nonnegative constrcutive represetnation is the cardinal directions. We could descirbe space using just north and east. Using such a basis with signed weightings, all of two-dimensional space could be spanned using north, negative north, east, and negative east. Instead we use constructive nonnegative representation to descibe space: north, south, east, and west.  -->
<!-- How are the coefficients computed? The basis vectors are not orthogonal, a simple projection of the point onto the basis does not compute the ceofficients that reconstruct the datapoint, $s_i \neq \mathbf{a}_i^\top \mathbf{x}$. Moreover, the resluting projections may also be negative and a rectifying them doesn't solve the reconstruction issue. 
Instead, the coefficients must be solved for jointly. Because 
We also favor sparse reconstructions. What this intuitively means is that only a small number of basis vectors out the larger dictionary are used to reconstruct the data point.  -->
<!-- We refer to this process as inference. Sparse coding assumes a sparse prior over the ceofficeints. What this intuitively means is that only a small number of basis vectors out the larger dictionary are used to reconstruct the data point. -->
<!-- Assuming that the basis spans the full 2-dimensional space, every point can be reached using at most two active coeffcients and this is evident in the animation above: only two basis vectors are used to represent each point. If the point is well aligned with one basis vector, then only one coefficient will be active. We'll refer to this process of solving for the sparse set of coeffcients as *sparse inference* or just *inference* for short.  -->
<!-- Another view of what sparse inference is doing is that its finding the set of coefficients that minimizes the path length to reach the point. 
Three could be used, but this  would be counterproductive and inefficient. More coefficients are used than what is necessary. You'd be back tracking.  -->
<!-- The pair of active coefficents  sparsty penalty finds the set of ceofficients  that reaches the datapoint using the shortest path. Only two basis vectors are used to reach the data point in the animation above. Using two minimizes that path length. Three could be used, but that would only make the path length longer. In this sense, the sparsity penalty makes the representation efficent.  -->


<!-- Certain hue directions, such as red, exhibit strong heavy-tailed structure as iso-probability contours in these directions extend farther from the origin than that of a Gaussian, while others have less heavy-tailed behavior. 

But those rare colors are not spread equally in every direction: some occur with greater saturation consistently more often than others. Moreover, the structure is asymmetric between opposing directions. That is, there are “special” directions in the eye’s color space due to the structure of our natural visual environment.

Importantly, If the chromatic statistics of natural scenes were gaussian, it would fall exactly along the dashed lines. These plots reveal the presence of higher-order, non-Gaussian statistical structure in the color distributions of natural images. We find that this structure is generally persistent across heterogeneous datasets.  
-->


<!-- The axes of the chromatic plane and thier relative scalings have been chosen such that the data has equal variance in all directions (Ruderman *et al.* (1998)). A natural comparison is thus an isotropic Gaussian that has identical variance. The contours from an isotropic Gaussian distribution with identical variance are overlaid on each plot. thus a natural distribution to compare to is an isotropic gaussian with idential covariance. -->



<!-- 
The model asks how the vectors should be arranged so that, across the dataset, colors can be reconstructed accurately with low total coefficient activity.
produce a more sparse representation in the coefficients, as measured by the sum of thier overall activities. 
[relate back to some basis vectors better than others. GIven nongaussian strucutre, some absis will be better than other. we can adapt basis to data. THe question the model is solving is how to place these vectors in the space such that there is a a maximizally sparse nonnegative code is produced in the coefficeints].  Doing so favors learning basis vectors that align with the directions in the data which occur rarely but with high magnitude, i.e., high-kurtosis or heavy-tailed directions (Field (1994), Simoncelli & Olshausen (2001), Ganguli & Sompolinski (2012)). T

To characterize these special directions in the color space we can adapt the sparse coding basis to the data. Figure 2 shows the process of inferring the coefficents given a particular basis. Now, we are going to consider adapting the basis to the structure in the data. 
 -->
<!-- 
As mentioned earlier, any given datapoint is represented by rescaling each basis by coefficient value and by combining the vectors end to end. Thus, the sum of the coefficients, i.e., the $\ell_1$-norm, is the pathlength to the data. Learning the basis answers the question of  how to arrange the basis vectors such that, when averaged over the distribution of the data, the path length is minimized.  -->

<!-- One must use higher-order statistical measures to characterize these features, such as the skew (the 3rd moment) or kurtosis (the 4th moment).  -->

<!-- Bruno Olshausen and David Field showed that a adapting sparse coding basis to image patches can account for the spatial receptive properties of simple-cells in visual cortex as an adaptation to natural image statistics. -->
<!-- The idea of sparse coding---originally proposed by Horace Barlow in the early 1970’s---is that neurons in the brain adapt to the statistics of the environment so as to form a complete representation of sensory input using a small fraction of active neurons (out of a large population) at any given point in time. Later work by -->
<!-- ~\cite{shepard1997perceptual,webster1997adaptation,mollon1997nature,mollon2006monge,rosenthal2018color,skelton2024effects,hedjar2025importance} -->
<!-- The central question is therefore not whether a basis can represent color, but what constitutes a 'good' basis.  -->
<!-- is best suited to describe the colors we actually encounter in the natural world.
It has long been suggested that color perception is shaped by the statistics of the natural visual environment~\cite{shepard1997perceptual,webster1997adaptation,mollon1997nature,mollon2006monge,rosenthal2018color,skelton2024effects,hedjar2025importance}. Could this provide an account for the unique hues?   -->

<!-- This notion can be formalized mathematically. A hue can be represented as a vector in a color space, and a set of hues can be combined to produce other hues.  serving as natural anchor points in color space can be formalized mathematically as a basis which consists of a set of basis vectors. 
Hering's description of the unique hues naturally maps to a mathematical basis for color appearance. And the axes of What does it mean for a set of colors to constrcut a basis? A set of bases for color appearance? What does that even mean.  -->
<!-- Each color in the basis is modelled as a vector that points in a particular hue direction.  -->

<!-- Only two basis vectors are used to reach the data point in the animation above as only two are necessary to reach the point. Three could be used, but that would only make the path length longer. This is not unique to having three basis vectors. Given a basis that spans an N-dimensional space under nonnegative weightings, only N nonzero ceofficeints are needed to represent a point in that space.  -->


<!-- 
To summarize, the basis provides the available color directions, and inference determines how strongly those directions contribute to a particular color. Sparse inference favors a nonnegative representation with minimal total coefficient activity. -->


<!-- 
Bring in four basis vectors. Heres what happens when you adapt four to the distribution. 
Compared to three vecotr solution, One vector remains pointed towards red, but now one points towards green, which pushes blue vector over a bit, and the green/yellow over to yellow.
The resulting arrangement---vectors aligned to red, green, blue, and yellow---forms a  correspondence with the unique hues. Psychophysical characterizations of the unique hues indicate that they do not typically align with the cone-opponent axes, but instead (with the exception of red) often lie in the quadrants between them~\cite{webster2000variations,wuerger2005cone,malkoc2005variations,wool2015salience}. Moreover, color-opponent pairs (green/red and blue/yellow) are not necessarily collinear (e.g., the line between red and green does not pass through the origin).  -->