export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <h1 className="text-4xl font-bold text-gray-700">
          Welcome to MessengerApp
        </h1>
      </div>
      <div className="text-center p-4 text-gray-500">
        Start by registering or logging in.
      </div>
    </div>
  );
}
