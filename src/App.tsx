import { useState, useEffect } from 'react';
import './App.css';

// 用于统计字母出现次数的函数
function getLetterCount(str: string) {
  const count: { [key: string]: number } = {};
  for (const char of str.toLowerCase()) {
    count[char] = (count[char] || 0) + 1;
  }
  return count;
}

// 检查单词是否可以由给定字母组成
function canFormWord(word: string, letterCount: { [key: string]: number }) {
  const wordCount = getLetterCount(word);
  return Object.entries(wordCount).every(
    ([char, count]) => (letterCount[char] || 0) >= count
  );
}

// 回溯算法找出所有可能的组合
function findCombinations(
  letterCount: { [key: string]: number },
  validWords: string[]
) {
  const result: string[] = [];

  const backtrack = (
    remaining: { [key: string]: number },
    path: string[],
    start: number
  ) => {
    // 如果所有字母都用完，记录组合
    if (Object.values(remaining).every((count) => count === 0)) {
      // 对组合中的词语按字母顺序排序
      const sortedPath = [...path].sort((a, b) => a.localeCompare(b));
      result.push(sortedPath.join(' '));
      return;
    }

    for (let i = start; i < validWords.length; i++) {
      const word = validWords[i];
      const wordCount = getLetterCount(word);

      // 检查是否可以使用当前单词
      let canUse = true;
      for (const [char, count] of Object.entries(wordCount)) {
        if ((remaining[char] || 0) < count) {
          canUse = false;
          break;
        }
      }
      if (!canUse) continue;

      // 创建新的remaining副本
      const newRemaining = { ...remaining };
      for (const [char, count] of Object.entries(wordCount)) {
        newRemaining[char] -= count;
        if (newRemaining[char] === 0) {
          delete newRemaining[char];
        }
      }

      backtrack(newRemaining, [...path, word], i + 1);
    }
  };

  backtrack(letterCount, [], 0);

  // 去重后排序，先按词数升序，再按字母顺序
  return [...new Set(result)].sort((a, b) => {
    const lenDiff = a.split(' ').length - b.split(' ').length;
    return lenDiff === 0 ? a.localeCompare(b) : lenDiff;
  });
}

function CombinationResultList({
  loading,
  results,
}: {
  loading: boolean;
  results: string[];
}) {
  const [search, setSearch] = useState('');
  const [filteredResults, setFilteredResults] = useState(results);

  useEffect(() => {
    setFilteredResults(results.filter((result) => result.includes(search)));
  }, [search, results]);

  if (loading) {
    return <div className='loading'>正在计算可能的组合...</div>;
  }
  if (results.length === 0) {
    return <div className='no-results'>没有找到任何组合</div>;
  } else {
    return (
      <div className='result-list'>
        <span className='result-list-title'>
          <h2>找到 {results.length} 个组合：</h2>
          <input
            id='search-input'
            type='text'
            placeholder='搜索词组'
            className='search-input'
            onChange={(e) => setSearch(e.target.value)}
          />
        </span>
        {filteredResults.length > 0 ? (
          filteredResults.map((result, index) => (
            <CombinationResultItem key={index} result={result} />
          ))
        ) : (
          <div className='no-results'>没有找到任何组合</div>
        )}
      </div>
    );
  }
}

function CombinationResultItem({ result }: { result: string }) {
  const words = result.split(' ');
  return (
    <div className='result-item'>
      {words.map((word, index) => (
        <span
          className='word'
          key={index}
          onClick={() => {
            window.open(`https://cn.bing.com/dict/search?q=${word}`, '_blank');
          }}
        >
          {word}
        </span>
      ))}
    </div>
  );
}

export default function App() {
  const [letters, setLetters] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载词库，只在组件挂载时执行一次
  useEffect(() => {
    fetch('/words.txt')
      .then((response) => response.text())
      .then((text) => {
        setWords(text.split('\n').map((word) => word.trim().toLowerCase()));
      })
      .catch((error) => {
        console.error('加载词库失败:', error);
      });
  }, []);

  // 提交表单时处理逻辑
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 获取有效单词
    const letters_without_space = letters.replace(/\s/g, '');
    const letterCount = getLetterCount(letters_without_space);
    const validWords = words.filter((word) => canFormWord(word, letterCount));

    // 使用setTimeout来避免UI阻塞
    setTimeout(() => {
      const combinations = findCombinations(letterCount, validWords);
      setResults(combinations);
      setLoading(false);
    }, 0);
  };

  return (
    <div className='app'>
      <h1>字母组合工具</h1>
      <form onSubmit={handleSubmit} className='input-form'>
        <input
          type='text'
          value={letters}
          onChange={(e) => setLetters(e.target.value)}
          placeholder='请输入字母'
          className='letter-input'
        />
        <button type='submit' disabled={!letters.trim() || loading}>
          {loading ? '计算中...' : '查找组合'}
        </button>
      </form>

      <div className='results'>
        <CombinationResultList loading={loading} results={results} />
      </div>
    </div>
  );
}
