import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Listing } from '../lib/types';
import { getMockReviews } from '../lib/reviews';
import { useUserReviews } from '../lib/userReviews';
import { StarRating, StarRatingInput } from './StarRating';

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
      <Text style={styles.sectionTitle}>Reviews</Text>

      {allReviews.map((review) => (
        <View key={review.id} style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Text style={styles.author}>{review.author}</Text>
            <Text style={styles.timeAgo}>{review.timeAgo}</Text>
          </View>
          <StarRating rating={review.rating} />
          <Text style={styles.comment}>{review.comment}</Text>
        </View>
      ))}

      <View style={styles.form}>
        <Text style={styles.formTitle}>Leave a review</Text>
        <StarRatingInput value={rating} onChange={setRating} />
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Share what made your stay memorable..."
          placeholderTextColor="#9a9a9a"
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
          <Text style={styles.submitLabel}>Post review</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 12,
  },
  reviewCard: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
  },
  timeAgo: {
    fontSize: 12,
    color: '#9a9a9a',
  },
  comment: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
  },
  form: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
  },
  input: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#222',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonPressed: {
    opacity: 0.85,
  },
  submitLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
