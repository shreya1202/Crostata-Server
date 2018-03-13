var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const PostSchema = new Schema({
  postId: String,
  creatorId: String,
  timeCreated: Date,
  contentType: String,
  textUrl: String,
  picUrl: String,
  upVotes: Number,
  downVotes: Number,
  isCensored: Boolean,
  isGenerated: Boolean,
});

module.exports = mongoose.models.Post || mongoose.model('Post', PostSchema);
