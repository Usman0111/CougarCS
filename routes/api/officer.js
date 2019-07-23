const express = require('express');

const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const multer = require('multer');
const fs = require('fs');
const { promisify } = require('util');
const Officer = require('../../models/Officer');
const Member = require('../../models/Member');

const unlinkAsync = promisify(fs.unlink);
const admin = require('../../middleware/admin');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './images/');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter
});

// @route   POST api/officer
// @desc    Add a officer
// @access  Private
// router.post(
//   '/',
//   admin,
//   upload.single('profileImage'),
//   [
//     check('firstName', 'First Name is required')
//       .not()
//       .isEmpty(),
//     check('lastName', 'Last Name is required')
//       .not()
//       .isEmpty(),
//     check('position', 'Position is required')
//       .not()
//       .isEmpty(),
//     check('email', 'Email is required').isEmail()
//   ],
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       await unlinkAsync(req.file.path);
//       return res.status(400).json({ msg: errors.array() });
//     }
//     const { firstName, lastName, email, position } = req.body;
//     try {
//       let officer = await Officer.findOne({ email });
//       if (officer) {
//         if (req.file) {
//           await unlinkAsync(req.file.path);
//         }
//         return res
//           .status(400)
//           .json({ errors: [{ msg: 'User already exists' }] });
//       }

//       officer = new Officer({
//         firstName,
//         lastName,
//         email,
//         position,
//         image: req.file.path
//       });
//       await officer.save();
//       res.json(officer);
//     } catch (err) {
//       await unlinkAsync(req.file.path);
//       console.error(err.message);
//       res.status(500).send('Server Error');
//     }
//   }
// );

// @route   GET api/officer/image/:imageID
// @desc    Get all officers
// @access  Public
// router.get('/image/:imageName', (req, res) => {
//   try {
//     const fileUpload = mongoose.connection.db.collection('uploadsPic.files');
//     const chuck = mongoose.connection.db.collection('uploadsPic.chunks');
//     fileUpload.find({ filename: req.params.imageName }).toArray((err, docs) => {
//       console.log(docs);

//       chuck
//         .find({ files_id: docs[0]._id })
//         .sort({ n: 1 })
//         .toArray((err, chunks) => {
//           console.log(chunks);

//           if (err) {
//             res.send(err);
//           }
//           let fileData = [];
//           for (let i = 0; i < chunks.length; i++) {
//             fileData.push(chunks[i].data.toString('base64'));
//           }
//           let resData = `data:${docs[0].contentType};base64,${fileData.join(
//             ''
//           )}`;
//           res.send(resData);
//         });
//     });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// });

// @route   GET api/officer
// @desc    Get all officers
// @access  Public
// router.get('/', async (req, res) => {
//   try {
//     const officers = await Officer.find();
//     res.json(officers);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// });

// // @route   GET api/officer/:officer_id
// // @desc    Get specific officers
// // @access  Private
// router.get('/:officer_id', async (req, res) => {
//   try {
//     const officers = await Officer.findById(req.params.officer_id);
//     if (!officers) {
//       return res.status(400).json({ msg: 'User not found' });
//     }
//     res.json(officers);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// });

// @route   PUT api/member/officer/:officer_id
// @desc    Edit a officer
// @access  Private
router.put(
  '/:officer_id',
  admin,
  upload.single('profileImage'),
  [
    check('firstName', 'First Name is required')
      .not()
      .isEmpty(),
    check('lastName', 'Last Name is required')
      .not()
      .isEmpty(),
    check('position', 'Position is required')
      .not()
      .isEmpty(),
    check('email', 'Email is required').isEmail()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file.path !== 'assets/users-01.png') {
        await unlinkAsync(req.file.path);
      }

      return res.status(400).json({ msg: errors.array() });
    }

    const {
      firstName,
      lastName,
      email,
      position,
      isCurrent,
      isOfficer
    } = req.body;

    const officerModelDetails = {
      officerMember: req.params.officer_id,
      position,
      isCurrent
    };
    const officerMember = {
      isOfficer,
      firstName,
      lastName,
      email,
      profileImage: req.file.path
    };

    try {
      let officer = await Officer.findOne({
        officerMember: req.params.officer_id
      });
      const member = await Member.findById(req.params.officer_id);

      if (officer) {
        if (member.profileImage !== 'assets/users-01.png') {
          await unlinkAsync(req.file.path);
        }
        // await member.save();
        await Officer.findByIdAndUpdate(
          officer.id,
          officerModelDetails,
          (err, obj) => {
            if (err) {
              return res
                .status(400)
                .json({ errors: [{ msg: 'Error updating' }] });
            }
          }
        );
        await Member.findByIdAndUpdate(
          req.params.officer_id,
          officerMember,
          (err, obj) => {
            if (err) {
              return res
                .status(400)
                .json({ errors: [{ msg: 'Error updating member' }] });
            }
            res.json(obj);
          }
        );
      } else if (!officer) {
        // await unlinkAsync(req.file.path);
        // return res.status(400).json({ errors: [{ msg: 'Error updating' }] });
        officer = new Officer(officerModelDetails);
        await officer.save();
        if (member.profileImage !== 'assets/users-01.png') {
          await unlinkAsync(req.file.path);
        }
        await Member.findByIdAndUpdate(
          req.params.officer_id,
          officerMember,
          (err, obj) => {
            if (err) {
              return res
                .status(400)
                .json({ errors: [{ msg: 'Error updating member' }] });
            }
            res.json(obj);
          }
        );
      } else {
        if (req.file.path !== 'assets/users-01.png') {
          await unlinkAsync(req.file.path);
        }
        res.status(500).send('Server Error');
      }
    } catch (err) {
      if (req.file.path !== 'assets/users-01.png') {
        await unlinkAsync(req.file.path);
      }
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// // // @route   DELETE api/officer/:officer_id
// // // @desc    Delete a officer
// // // @access  Private
// router.delete('/:officer_id', admin, async (req, res) => {
//   try {
//     const officer = await Officer.findById(req.params.officer_id);
//     if (!officer) {
//       return res.status(400).json({ msg: 'User not found' });
//     }
//     await Officer.findByIdAndDelete(req.params.officer_id, async (err, obj) => {
//       if (err) return res.status(500).send(err);
//       // gfs.files.deleteOne({ _id: officer.image.fileID }, (err, ret) => {
//       //   if (err) console.log(err);
//       // });
//       await unlinkAsync(officer.image);

//       res.json(obj);
//     });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// });
module.exports = router;
