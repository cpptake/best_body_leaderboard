import React, { useState } from 'react';

export default function UsernameInput({ onUsernameChange, username }) {
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;

    // ユーザー名のバリデーション
    if (value.length > 50) {
      setError('ユーザー名は50文字以内である必要があります');
      return;
    }

    if (value && !/^[a-zA-Z0-9_-]*$/.test(value)) {
      setError('英数字、アンダースコア、ハイフンのみ使用できます');
      return;
    }

    setError('');
    onUsernameChange(value);
  };

  return (
    <div className="mb-6">
      <label htmlFor="username" className="block text-lg font-semibold text-gray-700 mb-2">
        ユーザー名 <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        id="username"
        value={username}
        onChange={handleChange}
        placeholder="例: muscle_king"
        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        }`}
        required
      />
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
      <p className="mt-2 text-sm text-gray-500">
        英数字、アンダースコア、ハイフンのみ使用可能（1〜50文字）
      </p>
    </div>
  );
}
