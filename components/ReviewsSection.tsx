import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Listing } from '../lib/types';
import { getMockReviews } from '../lib/reviews';
import { useUserReviews } from '../lib/userReviews';
import { StarRating, StarRatingInput } from './StarRating';

const GOLD = '#C8A86B';
const TEXT = '#F5F3EF';
const MUTED = '#555555';
const DIVIDER = '#1E1E1E';
const SURFACE = '#141414';

interface DisplayReview {
  id: string;
  author: string;
  rating: number;
  timeAgo: string;
  comment: string;
}

interface Props {
  listing: Listing;
}

export function ReviewsSection({ listing }: Props) {
  const mockReviews = useMemo(() => getMockReviews(listing), [listing]);
  const { getReviewsForListing, addReview } = useUserReviews();
  const userReviews = getReviewsForListing(listing.id);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const allReviews: DisplayReview[] = [
    ...userReviews.map((review) => ({
      id: review.id,
      author: 'You',
      rating: review.rating,
      timeAgo: 'Just now',
      comment: review.comment,
    })),
    ...mockReviews,
  ];

  const handleSubmit = () => {
    const trimmed = comment.trim();
    if (!trimmed) return;
    addReview(listing.id, rating, trimmed);
    setComment('');
    setRating(5);
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>REVIEWS</Text>

      {allReviews.map((review) => (
        <View key={review.id} style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewMeta}>
              <Text style={styles.author}>{review.author}</Text>
              <Text style={styles.timeAgo}>{review.timeAgo.toUpperCase()}</Text>
            </View>
            <StarRating rating={review.rating} size={12} />
          </View>
          <Text style={styles.comment}>{review.comment}</Text>
        </View>
      ))}

      <View style={styles.form}>
        <Text style={styles.formTitle}>LEAVE A REVIEW</Text>
        <StarRatingInput value={rating} onChange={setRating} size={26} />
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Share what made your stay memorable..."
          placeholderTextColor={MUTED}
          style={styles.input}
          multiline
          numberOfLines={3}
        />
        <Pressable
          onPress={handleSubmit}
          disabled={!comment.trim()}
          style={({ pressed }) => [
            styles.submitButton,
            !comment.trim() && styles.submitButtonDisabled,
            pressed && comment.trim() && styles.submitButtonPressed,
          ]}
        >
          <Text style={[styles.submitLabel, !comment.trim() && styles.submitLabelDisabled]}>
            POST REVIEW
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 2.5,
    marginBottom: 16,
  },
  reviewCard: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewMeta: {
    gap: 2,
  },
  author: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: 0.5,
  },
  timeAgo: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 1.5,
  },
  comment: {
    fontSize: 13,
    lineHeight: 20,
    color: '#888888',
  },
  form: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
  },
  formTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 2.5,
    marginBottom: 14,
  },
  input: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    backgroundColor: SURFACE,
    color: TEXT,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  submitButtonDisabled: {
    borderColor: '#2A2A2A',
  },
  submitButtonPressed: {
    backgroundColor: GOLD,
  },
  submitLabel: {
    color: GOLD,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 2,
  },
  submitLabelDisabled: {
    color: MUTED,
  },
});
