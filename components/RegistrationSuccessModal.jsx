/**
 * CRM: Shown after creating a user via the registration wizard. Redirects back to Users list.
 */
const RegistrationSuccessModal = ({ user, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8">
        <div className="text-center">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">User created successfully</h2>
          {user?.firstName && (
            <p className="text-gray-600 mb-6">
              {user.firstName} {user.email && `(${user.email})`}
            </p>
          )}
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-admin-primary hover:bg-admin-primary/90 text-white font-semibold rounded-lg transition"
          >
            Back to Users
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccessModal;
