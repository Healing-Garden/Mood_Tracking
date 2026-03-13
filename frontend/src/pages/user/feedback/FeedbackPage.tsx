import FeedbackForm from '../../../components/features/FeedbackForm';
import DashboardLayout from '../../../components/layout/DashboardLayout';

const FeedbackPage = () => {
    return (
        <DashboardLayout title="Help & Feedback">
            <div className="px-4 sm:px-6 lg:px-8 py-3 flex justify-center">
                <div className="w-full max-w-2xl">
                    <div className="mb-4 text-center">
                        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">We value your feedback</h2>
                        <p className="text-slate-500">
                            Your thoughts and suggestions help us make Healing Garden better for everyone.
                            Whether it's a new feature idea, a bug report, or just general praise, we're listening!
                        </p>
                    </div>

                    <FeedbackForm />
                </div>
            </div>
        </DashboardLayout>
    );
};

export default FeedbackPage;
