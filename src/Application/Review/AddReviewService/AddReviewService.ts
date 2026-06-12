import { ITransactionManager } from "Application/shared/ITransactionManager";
import { IBookRepository } from "Domain/models/Book/IBookRepository";
import { IReviewRepository } from "Domain/models/Review/IReviewRepository";
import { AddReviewDTO } from "./AddReviewDTO";
import { BookId } from "Domain/models/Book/BookId/BookId";
import { ReviewId } from "Domain/models/Review/ReviewId/ReviewId";
import { ReviewIdentity } from "Domain/models/Review/ReviewIdentity/ReviewIdentity";
import { Name } from "Domain/models/Review/Name/Name";
import { Rating } from "Domain/models/Review/Rating/Rating";
import { Review } from "Domain/models/Review/Review";
import { Comment } from "Domain/models/Review/Comment/Comment";

export type AddReviewCommand = {
  bookId: string;
  name: string;
  rating: number;
  comment?: string;
}

export class AddReviewService {
  constructor(
    private reviewRepository: IReviewRepository,
    private bookRepository: IBookRepository,
    private transactionManager: ITransactionManager
  ) {}

  async execute(command: AddReviewCommand): Promise<AddReviewDTO> {
    // 対象の書籍が存在するか確認
    const book = await this.bookRepository.findById(new BookId(command.bookId));

    if (!book) {
      throw new Error("書籍が存在しません");
    }

    return await this.transactionManager.begin(async () => {
      const reviewId = new ReviewId();
      const reviewIdentity = new ReviewIdentity(reviewId);
      const name = new Name(command.name);
      const rating = new Rating(command.rating);
      const comment = command.comment ? new Comment(command.comment) : undefined;

      const review = Review.create(
        reviewIdentity,
        book.bookId,
        name,
        rating,
        comment
      );

      await this.reviewRepository.save(review);

      return {
        id: review.reviewId.value,
        bookId: review.bookId.value,
        name: review.name.value,
        rating: review.rating.value,
        comment: review.comment?.value,
      }
    })
  }
}
