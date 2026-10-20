
const Hero = require("../models/Hero");
const cloudinary = require("../config/cloudinary");

exports.getHero = async (req, res) => {
  try {
    let hero = await Hero.findOne();

    if (!hero) {
      hero = await Hero.create({});
    }

    return res.status(200).json({
      success: true,
      data: hero,
    });
  } catch (error) {
    console.error("Get Hero error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Hero content",
    });
  }
};

exports.updateHero = async (req, res) => {
  try {
    let hero = await Hero.findOne();

    if (!hero) {
      hero = new Hero();
    }

    const fields = [
      "eyebrow",
      "heading",
      "subheading",
      "description",
      "buttonText",
      "buttonLink",
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        hero[field] = req.body[field];
      }
    });

    let previousPublicId = null;

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "midhun-frames/hero",
            resource_type: "image",
          },
          (error, uploadedImage) => {
            if (error) {
              return reject(error);
            }

            resolve(uploadedImage);
          }
        );

        stream.end(req.file.buffer);
      });

      previousPublicId = hero.imagePublicId;

      hero.imageUrl = result.secure_url;
      hero.imagePublicId = result.public_id;
    }

    await hero.save();

    // Remove the old image only after the new image and content are saved.
    if (previousPublicId) {
      cloudinary.uploader
        .destroy(previousPublicId)
        .catch((error) => {
          console.error("Previous Hero image cleanup failed:", error);
        });
    }

    return res.status(200).json({
      success: true,
      message: "Hero section updated successfully",
      data: hero,
    });
  } catch (error) {
    console.error("Update Hero error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update Hero section",
    });
  }
};
